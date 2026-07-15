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
} from '@sentry/types';
import { addFetchInstrumentationHandler } from '@sentry/utils';
import { v4 as uuidv4 } from 'uuid';

const NAME = 'ConsensysTracePropagation';

/** RAPID baggage application identifier. */
const CONSENSYS_APPLICATION = 'metamask-extension';

/** W3C `trace-flags` sampled bit (bit 0). */
const TRACE_FLAG_SAMPLED = 1;

/**
 * Backend API host patterns that should receive distributed-trace propagation
 * (W3C `traceparent` + RAPID baggage) on outbound HTTPS.
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
 * Whether a W3C `trace-flags` byte has the sampled bit (bit 0) set, without a
 * bitwise mask (disallowed by lint).
 *
 * @param flags - Decimal value of the `trace-flags` byte.
 * @returns True when the sampled bit is set.
 *
 */
// TODO: Remove once sentry SDK is upgraded to v10.
function isSampled(flags: number): boolean {
  return flags % 2 === TRACE_FLAG_SAMPLED;
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
 * Build the W3C `traceparent` for the current trace context. Reads the active
 * span when present, otherwise the merged scope propagation context, so the
 * trace id matches the `sentry-trace` the SDK propagates.
 *
 * @returns A W3C `traceparent` string, or undefined when no trace id is known.
 */
// TODO: Remove once sentry SDK is upgraded to v10.
export function getCurrentTraceparent(): string | undefined {
  try {
    const activeSpan = getActiveSpan();
    if (activeSpan) {
      const { traceId, spanId, traceFlags } = activeSpan.spanContext();
      if (!traceId || !spanId) {
        return undefined;
      }
      const flags = isSampled(traceFlags ?? TRACE_FLAG_SAMPLED) ? '01' : '00';
      return `00-${traceId}-${spanId}-${flags}`;
    }

    const { traceId, spanId, sampled } = {
      ...getIsolationScope().getPropagationContext(),
      ...getCurrentScope().getPropagationContext(),
    };
    if (!traceId || !spanId) {
      return undefined;
    }
    return `00-${traceId}-${spanId}-${sampled === false ? '00' : '01'}`;
  } catch {
    return undefined;
  }
}

/**
 * Build the RAPID `baggage` segment for an outbound request.
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
 * Build a new `Headers` for an outbound fetch with the W3C `traceparent` and
 * RAPID baggage appended. Seeds from the existing request headers (the SDK's
 * `sentry-trace` / `baggage` are already present when this runs after Sentry's
 * instrumentation), so nothing the caller or the SDK set is lost.
 *
 * @param args - The fetch arguments (`[input, init]`).
 * @param fields - The values to inject.
 * @param fields.traceparent - W3C traceparent, or undefined to skip.
 * @param fields.requestId - The `consensys-request-id`.
 * @returns A new `Headers` instance to assign to the request init.
 */
export function buildAugmentedHeaders(
  args: unknown[],
  { traceparent, requestId }: { traceparent?: string; requestId: string },
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
  // Respect a caller- or SDK-provided `traceparent`; only set ours when absent.
  // TODO: Remove this block and the `traceparent` param once sentry SDK is upgraded to v10.
  if (traceparent && !headers.has('traceparent')) {
    headers.set('traceparent', traceparent);
  }
  // `baggage` is appended (not set): repeated baggage headers are merged by the
  // browser, so this preserves the SDK's Sentry-prefixed entries.
  headers.append('baggage', buildConsensysBaggage(requestId));
  return headers;
}

// TODO: Remove once sentry SDK is upgraded to v10.
function getTraceIdFromTraceparent(traceparent: string): string | undefined {
  const [, traceId] = traceparent.split('-');
  return traceId || undefined;
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
 * Sentry integration that propagates W3C `traceparent` and RAPID baggage
 * (`consensys-request-id`, `consensys-application=metamask-extension`) on
 * outbound HTTPS to backend API hosts, and tags Sentry events with the
 * correlation ids (`otelTraceId`, `consensysRequestId`).
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

          const traceparent = getCurrentTraceparent();
          if (traceparent) {
            // TODO: Remove `getTraceIdFromTraceparent` call once sentry SDK is upgraded to v10.
            // Source the trace id from `getActiveSpan().spanContext()`.
            const traceId = getTraceIdFromTraceparent(traceparent);
            if (traceId) {
              setRequestIdForTraceId(traceId, requestId);
            }
          }
          const headers = buildAugmentedHeaders(handlerData.args, {
            // TODO: Remove `traceparent` argument once sentry SDK is upgraded to v10.
            traceparent,
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
