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
 * Merge a fetch call's `Request` headers with its `init` headers into a single
 * `Headers`, with `init` winning on duplicate keys — the precedence the platform
 * applies when `fetch` receives both.
 *
 * @param args - The fetch arguments (`[input, init]`).
 * @returns A new `Headers` instance holding the request's effective headers.
 */
function mergeFetchHeaders(args: unknown[]): Headers {
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
export function buildAugmentedHeaders(
  args: unknown[],
  { requestId }: { requestId: string },
): Headers {
  const headers = mergeFetchHeaders(args);
  // `baggage` is appended (not set): repeated baggage headers are merged by the
  // browser, so this preserves the SDK's Sentry-prefixed entries.
  headers.append('baggage', buildConsensysBaggage(requestId));
  return headers;
}

/** Headers that advertise a trace parent on an outbound request. */
const TRACE_PARENT_HEADERS = ['sentry-trace', 'traceparent'];

/** Prefix of the `baggage` entries that carry Sentry's trace context. */
const SENTRY_BAGGAGE_PREFIX = 'sentry-';

/**
 * Remove every trace header from an outbound request's effective headers:
 * `sentry-trace`, `traceparent`, and the Sentry-prefixed `baggage` entries.
 * Non-Sentry `baggage` entries and all other headers are preserved.
 *
 * Used to hold the outbound invariant when no span is active. The SDK's fetch
 * instrumentation attaches these headers whenever the URL matches
 * `tracePropagationTargets`, independently of whether a span exists; with no
 * span it derives them from the scope propagation context, so the advertised
 * parent is a freshly minted id belonging to no span.
 *
 * @param args - The fetch arguments (`[input, init]`).
 * @returns A new `Headers` instance without trace headers, or `undefined` when
 * the request carried none — so the caller can leave the fetch arguments as
 * they are rather than rewriting them to an equivalent value.
 */
export function stripTraceHeaders(args: unknown[]): Headers | undefined {
  const headers = mergeFetchHeaders(args);
  let removed = false;

  for (const name of TRACE_PARENT_HEADERS) {
    if (headers.has(name)) {
      headers.delete(name);
      removed = true;
    }
  }

  const baggage = headers.get('baggage');
  if (baggage !== null) {
    const entries = baggage.split(',').map((entry) => entry.trim());
    const kept = entries.filter(
      (entry) => entry && !entry.startsWith(SENTRY_BAGGAGE_PREFIX),
    );
    if (kept.length !== entries.length) {
      removed = true;
      if (kept.length > 0) {
        headers.set('baggage', kept.join(','));
      } else {
        headers.delete('baggage');
      }
    }
  }

  return removed ? headers : undefined;
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
 * Also enforces the outbound invariant: a matched request made while no span is
 * active carries no trace headers at all — the SDK's `sentry-trace` /
 * `traceparent` / Sentry `baggage` are stripped and the Consensys segment is
 * withheld, rather than advertising a parent that points at no span.
 *
 * Must be registered after `browserTracingIntegration` so the SDK's
 * `sentry-trace` / `baggage` headers are already attached when the fetch hook
 * augments or strips them.
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
          // Outbound invariant: never advertise a trace parent that points at
          // nothing. The SDK attaches `sentry-trace` / `traceparent` / Sentry
          // `baggage` to every `tracePropagationTargets` match, including when
          // no span is active — then the parent id comes from the scope
          // propagation context and belongs to no span the backend can ever
          // join. Strip what the SDK attached, and withhold the Consensys
          // `baggage` segment, which has no trace to correlate against.
          if (!getActiveSpan()) {
            const strippedHeaders = stripTraceHeaders(handlerData.args);
            if (strippedHeaders) {
              handlerData.args[1] = handlerData.args[1] || {};
              handlerData.args[1].headers = strippedHeaders;
            }
            return;
          }

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
