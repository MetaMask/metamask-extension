import {
  getActiveSpan,
  getCurrentScope,
  getIsolationScope,
} from '@sentry/browser';
import type {
  Client,
  Event as SentryEvent,
  EventHint,
  Integration,
} from '@sentry/core';
import { addFetchInstrumentationHandler } from '@sentry/core';
import { v4 as uuidv4 } from 'uuid';

const NAME = 'ConsensysTracePropagation';

/** Consensys baggage application identifier. */
const CONSENSYS_APPLICATION = 'metamask-extension';

/**
 * Backend API host patterns that should receive distributed-trace propagation
 * on outbound HTTPS. The Sentry SDK injects `sentry-trace` / `traceparent` on
 * these hosts (via `tracePropagationTargets` + `propagateTraceparent`); this
 * integration appends the Consensys `baggage`.
 */
export const BACKEND_TRACE_PROPAGATION_TARGETS: RegExp[] = [
  /^https:\/\/[a-z0-9.-]+\.(?:[a-z0-9]+-)?api\.cx\.metamask\.io(?:[/?#]|$)/u,
];

let requestIdProvider: () => string = () => uuidv4();
let currentConsensysRequestId: string | undefined;
// `null` marks a trace that fanned out to more than one request id.
// A trace-level Sentry error can't be attributed to a single outbound request, so
// the tag is suppressed rather than attaching a misleading last-write-wins id.
const requestIdByTraceId = new Map<string, string | null>();
const MAX_TRACE_REQUEST_ID_ENTRIES = 100;

const TRACE_ID = /^[0-9a-f]{32}$/u;
const SPAN_ID = /^[0-9a-f]{16}$/u;

/**
 * Override the `consensys-request-id` source (e.g. a per-operation provider
 * that returns one id for all HTTP calls within a transaction lifecycle).
 *
 * @param provider - Returns the id to attach to the next outbound request.
 */
export function setConsensysRequestIdProvider(provider: () => string): void {
  requestIdProvider = provider;
}

/**
 * Test helper that resets the request-id provider and cached id.
 */
export function resetConsensysRequestIdProvider(): void {
  requestIdProvider = () => uuidv4();
  currentConsensysRequestId = undefined;
  requestIdByTraceId.clear();
}

/**
 * The id attached to the most recent matched outbound request. Best-effort
 * correlation handle for Sentry event enrichment under per-request scoping; a
 * per-operation provider makes this precise.
 *
 * @returns The current `consensys-request-id`, or undefined if none yet.
 */
export function getCurrentConsensysRequestId(): string | undefined {
  return currentConsensysRequestId;
}

/**
 * Whether a URL targets a backend host configured for trace propagation.
 *
 * @param url - The outbound request URL.
 * @returns True when the URL matches a backend target.
 */
export function matchesBackendTarget(url: string): boolean {
  return BACKEND_TRACE_PROPAGATION_TARGETS.some((pattern) => pattern.test(url));
}

/**
 * The current trace id, read from the active span when present, otherwise the
 * merged scope propagation context. Used only to correlate an outbound
 * request's `consensys-request-id` with the Sentry trace for event enrichment —
 * the W3C `traceparent` header itself is injected natively by the SDK
 * (`propagateTraceparent`).
 *
 * @returns The current trace id, or undefined when none is known.
 */
function getCurrentTraceId(): string | undefined {
  try {
    const activeSpan = getActiveSpan();
    if (activeSpan) {
      return activeSpan.spanContext().traceId || undefined;
    }
    const { traceId } = {
      ...getIsolationScope().getPropagationContext(),
      ...getCurrentScope().getPropagationContext(),
    };
    return traceId || undefined;
  } catch {
    return undefined;
  }
}

/**
 * Build the Consensys `baggage` segment for an outbound request.
 *
 * @param requestId - The `consensys-request-id` value.
 * @returns A baggage segment string.
 */
export function buildConsensysBaggage(requestId: string): string {
  return `consensys-request-id=${requestId},consensys-application=${CONSENSYS_APPLICATION}`;
}

/**
 * Whether a value is a `Request` instance (guarding against environments
 * without the global).
 *
 * @param value - The value to test.
 * @returns True when `value` is a `Request`.
 */
function isRequest(value: unknown): value is Request {
  return typeof Request !== 'undefined' && value instanceof Request;
}

/**
 * Normalize any fetch headers representation (`Headers`, an array of pairs, a
 * record, or a `Request`'s headers) into a fresh `Headers`, dropping nullish
 * values.
 *
 * @param existing - The existing headers value, if any.
 * @returns A new `Headers` instance.
 */
function toHeaders(existing: unknown): Headers {
  const headers = new Headers();
  if (!existing) {
    return headers;
  }
  if (typeof Headers !== 'undefined' && existing instanceof Headers) {
    existing.forEach((value, key) => headers.append(key, value));
  } else if (Array.isArray(existing)) {
    for (const entry of existing) {
      const [key, value] = entry as [string, unknown];
      if (value !== undefined && value !== null) {
        headers.append(key, String(value));
      }
    }
  } else if (typeof existing === 'object') {
    for (const [key, value] of Object.entries(existing)) {
      if (value !== undefined && value !== null) {
        headers.append(key, String(value));
      }
    }
  }
  return headers;
}

/**
 * Build a new `Headers` for an outbound fetch with the Consensys `baggage`
 * appended. Seeds from the existing request headers (the SDK's `sentry-trace` /
 * `baggage` / `traceparent` are already present when this runs after Sentry's
 * instrumentation), so nothing the caller or the SDK set is lost.
 *
 * @param args - The fetch arguments (`[input, init]`).
 * @param fields - The values to inject.
 * @param fields.requestId - The `consensys-request-id`.
 * @returns A new `Headers` instance to assign to the request init.
 */
/**
 * Rewrite the SDK's `traceparent` so the sampled bit is set and the parent span
 * id matches the one `sentry-trace` advertises.
 *
 * ADR-0060's propagation contract requires the W3C `trace-flags` sampled bit to
 * travel unconditionally, "so that backend can continue every trace into Tempo".
 * The SDK does the opposite: a deferred or negatively sampled decision yields
 * `-00`, a parent-respecting backend sampler then records nothing, and the trace
 * is absent from Tempo as well as Sentry — measured as 0 backend spans from 5
 * requests, against 3 of 3 with `-01`, same host and same baggage.
 *
 * Sending `-01` for a trace the client did not keep produces a backend span whose
 * parent is not in Sentry. That is intended: Tempo is the comprehensive store and
 * orphan roots are normal there at low client sample rates. Keeping those spans
 * out of Sentry is the collector's `sentry.sampled` filter, not the client's job
 * — the two conditions are independent, and suppressing the header to fix Sentry
 * costs Tempo the trace.
 *
 * `sentry-trace` is deliberately left alone, so Sentry's own view of the sampling
 * decision stays honest.
 *
 * @param headers - Outbound headers, after the SDK has populated them.
 */
function forceSampledTraceparent(headers: Headers): void {
  const sentryTrace = headers.get('sentry-trace');
  const traceparent = headers.get('traceparent');
  if (!sentryTrace || !traceparent) {
    return;
  }

  const [traceId, spanId] = sentryTrace.split('-');
  if (!TRACE_ID.test(traceId ?? '') || !SPAN_ID.test(spanId ?? '')) {
    return;
  }

  // The SDK mints an independent span id for each header when no span is active,
  // so the two can name different parents; align them on `sentry-trace`'s.
  headers.set('traceparent', `00-${traceId}-${spanId}-01`);
}

export function buildAugmentedHeaders(
  args: unknown[],
  { requestId }: { requestId: string },
): Headers {
  const [request, options] = args as [
    unknown,
    { headers?: unknown } | undefined,
  ];
  const requestHeaders = isRequest(request) ? request.headers : undefined;
  const headers = toHeaders(requestHeaders);
  const initHeaders = toHeaders(options?.headers);

  initHeaders.forEach((value, key) => {
    headers.set(key, value);
  });
  // `baggage` is appended (not set): repeated baggage headers are merged by the
  // browser, so this preserves the SDK's Sentry-prefixed entries.
  headers.append('baggage', buildConsensysBaggage(requestId));
  forceSampledTraceparent(headers);
  return headers;
}

function setRequestIdForTraceId(traceId: string, requestId: string): void {
  if (requestIdByTraceId.has(traceId)) {
    // A trace can fan out to multiple outbound requests, each with its own id.
    // Once a second distinct id arrives, mark the trace ambiguous (`null`) so
    // `processEvent` suppresses `consensysRequestId` rather than reporting a
    // wrong one; a per-operation request-id provider removes the ambiguity.
    if (requestIdByTraceId.get(traceId) !== requestId) {
      requestIdByTraceId.set(traceId, null);
    }
    return;
  }
  requestIdByTraceId.set(traceId, requestId);
  if (requestIdByTraceId.size <= MAX_TRACE_REQUEST_ID_ENTRIES) {
    return;
  }

  const oldestTraceId = requestIdByTraceId.keys().next().value;
  if (oldestTraceId) {
    requestIdByTraceId.delete(oldestTraceId);
  }
}

/**
 * Sentry integration that appends Consensys baggage (`consensys-request-id`,
 * `consensys-application=metamask-extension`) on outbound HTTPS to backend API
 * hosts, and tags Sentry events with the correlation ids (`otelTraceId`,
 * `consensysRequestId`). The W3C `traceparent` / `sentry-trace` headers are
 * injected natively by the SDK (`propagateTraceparent` + `tracePropagationTargets`).
 *
 * Must be registered after `browserTracingIntegration` so the SDK's
 * `sentry-trace` / `baggage` headers are already attached when the fetch hook
 * augments them.
 *
 * @param options - Options bag.
 * @param options.log - Function to log diagnostic messages.
 * @returns A Sentry integration.
 */
export function consensysTracePropagationIntegration({
  log,
}: {
  log: (message: string, ...args: unknown[]) => void;
}): Integration {
  return {
    name: NAME,
    afterAllSetup: () => {
      addFetchInstrumentationHandler((handlerData) => {
        // The handler fires at request start (no `endTimestamp`) and again on
        // response; only the start invocation can mutate the outgoing request.
        if (handlerData.endTimestamp !== undefined) {
          return;
        }
        const url = handlerData.fetchData?.url;
        if (!url || !matchesBackendTarget(url)) {
          return;
        }
        try {
          const requestId = requestIdProvider();
          currentConsensysRequestId = requestId;

          const traceId = getCurrentTraceId();
          if (traceId) {
            setRequestIdForTraceId(traceId, requestId);
          }
          const headers = buildAugmentedHeaders(handlerData.args, {
            requestId,
          });
          // Default the fetch `init` (the SDK does the same) before attaching
          // the merged headers, so they survive into the real fetch call.
          handlerData.args[1] = handlerData.args[1] || {};
          handlerData.args[1].headers = headers;
        } catch (error) {
          // Header injection must never break the outbound request.
          log('Failed to propagate trace headers', error);
        }
      });
    },
    processEvent: (event: SentryEvent, _hint: EventHint, _client: Client) => {
      const traceId = event.contexts?.trace?.trace_id;
      if (traceId) {
        event.tags = { ...event.tags, otelTraceId: traceId };
        const requestId = requestIdByTraceId.get(traceId);
        if (requestId) {
          event.tags = {
            ...event.tags,
            consensysRequestId: requestId,
          };
        }
      }
      return event;
    },
  };
}
