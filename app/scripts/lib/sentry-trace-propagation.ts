import {
  getActiveSpan,
  getCurrentScope,
  getIsolationScope,
  getTraceData,
  spanToJSON,
} from '@sentry/browser';
import type {
  Client,
  Event as SentryEvent,
  EventHint,
  Integration,
  Span,
} from '@sentry/core';
import {
  addFetchInstrumentationHandler,
  getDefaultCurrentScope,
} from '@sentry/core';
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
 * @param activeSpan - The span the request runs under, if any.
 * @returns The current trace id, or undefined when none is known.
 */
function getCurrentTraceId(activeSpan: Span | undefined): string | undefined {
  try {
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
 * Merge a fetch call's `Request` headers with its `init` headers, `init`
 * winning on duplicate keys. Setting `init.headers` replaces a `Request`'s
 * headers wholesale, so they are copied in first.
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

const TRACE_PARENT_HEADERS = ['sentry-trace', 'traceparent'];

const SENTRY_BAGGAGE_PREFIX = 'sentry-';

/**
 * Remove `sentry-trace`, `traceparent` and Sentry-prefixed `baggage` entries
 * from a fetch's effective headers, keeping everything else.
 *
 * @param args - The fetch arguments (`[input, init]`).
 * @returns The stripped headers, or `undefined` when there was nothing to strip.
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

function isRunning(span: Span): boolean {
  return spanToJSON(span).timestamp === undefined;
}

/**
 * The span a request should run under: the active span while it runs. An ended
 * span can stay active after concurrent async spans pop the scope stack out of
 * order, and then the base scope's span (the pageload) is the running one.
 *
 * @param activeSpan - The active span, if any.
 * @returns A running span, or `undefined` when there is none.
 */
function getRunningSpan(activeSpan: Span | undefined): Span | undefined {
  if (!activeSpan) {
    return undefined;
  }
  if (isRunning(activeSpan)) {
    return activeSpan;
  }
  const baseSpan = getDefaultCurrentScope().getScopeData().span;
  return baseSpan && isRunning(baseSpan) ? baseSpan : undefined;
}

/**
 * Point a fetch's trace headers at `span`, replacing the ones the SDK attached
 * for the ended active span.
 *
 * @param args - The fetch arguments (`[input, init]`), whose `init.headers` is replaced.
 * @param span - The running span to name as the parent.
 * @returns False when the span yields no trace data and the headers were left alone.
 */
function retargetTraceHeaders(args: unknown[], span: Span): boolean {
  const traceData = getTraceData({ span, propagateTraceparent: true });
  if (!traceData['sentry-trace']) {
    return false;
  }
  const headers = stripTraceHeaders(args) ?? mergeFetchHeaders(args);
  headers.set('sentry-trace', traceData['sentry-trace']);
  if (traceData.traceparent) {
    headers.set('traceparent', traceData.traceparent);
  }
  if (traceData.baggage) {
    headers.append('baggage', traceData.baggage);
  }
  const init = (args[1] = args[1] || {}) as { headers?: Headers };
  init.headers = headers;
  return true;
}

export type BackendRequestClaim = {
  span: Span;
  claims: (url: string) => boolean;
};

const localRequestClaims = new Set<BackendRequestClaim>();

// The background bundles this module twice: `sentry-install` reads the claims
// and the operations write them. They share one registry on
// `globalThis.stateHooks`, which LavaMoat leaves in place (as in
// `shared/lib/trace.ts`).
function getRequestClaims(): Set<BackendRequestClaim> {
  const hooks = globalThis.stateHooks;
  if (!hooks) {
    return localRequestClaims;
  }
  hooks.backendRequestClaims ??= new Set();
  return hooks.backendRequestClaims;
}

/**
 * Send matching backend requests under `span` while it runs, for an operation
 * whose later requests leave from code it cannot hand a `fetch`, after the
 * span has stopped being the active span. Their trace headers name `span`, and
 * no `http.client` span is recorded for them under another span.
 *
 * @param span - The operation's running root.
 * @param claims - Whether a request URL belongs to the operation.
 * @returns A function that releases the claim.
 */
export function claimBackendRequests(
  span: Span,
  claims: (url: string) => boolean,
): () => void {
  const requestClaims = getRequestClaims();
  const claim = { span, claims };
  requestClaims.add(claim);
  return () => {
    requestClaims.delete(claim);
  };
}

/**
 * The running span that claims a request, when it is not the active span.
 *
 * @param url - The request URL.
 * @returns The claiming span, or `undefined`.
 */
export function getClaimingSpan(url: string): Span | undefined {
  const activeSpan = getActiveSpan();
  for (const { span, claims } of getRequestClaims()) {
    if (span !== activeSpan && isRunning(span) && claims(url)) {
      return span;
    }
  }
  return undefined;
}

// The SDK asks `shouldCreateSpanForRequest` again when a request ends, and ends
// the request's span only if the answer is still yes. A request that started
// unclaimed, under its operation's root, stays unclaimed until it ends, though
// the root has stopped being the active span by then. Both checks run in the
// `sentry-install` copy, so this state is local.
const unclaimedRequests = new WeakSet<object>();
const unclaimedRequestsByUrl = new Map<string, number>();

function trackUnclaimedRequest(fetchData: object, url: string): void {
  unclaimedRequests.add(fetchData);
  unclaimedRequestsByUrl.set(url, (unclaimedRequestsByUrl.get(url) ?? 0) + 1);
}

function releaseUnclaimedRequest(fetchData: object, url: string): void {
  if (!unclaimedRequests.delete(fetchData)) {
    return;
  }
  const count = (unclaimedRequestsByUrl.get(url) ?? 1) - 1;
  if (count > 0) {
    unclaimedRequestsByUrl.set(url, count);
  } else {
    unclaimedRequestsByUrl.delete(url);
  }
}

/**
 * Whether a request is claimed, giving the same answer at its end as its start.
 * @param url - The request URL.
 * @returns True when a claimant names the request's parent.
 */
export function isClaimedRequest(url: string): boolean {
  return !unclaimedRequestsByUrl.has(url) && getClaimingSpan(url) !== undefined;
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
 * With no running span, a matched request goes out with no trace headers and no
 * Consensys `baggage`.
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
        const { fetchData } = handlerData;
        const url = fetchData?.url;
        if (!url || !matchesBackendTarget(url)) {
          return;
        }
        // The handler fires at request start (no `endTimestamp`) and again on
        // response; only the start invocation can mutate the outgoing request.
        // It runs after the SDK's handler, which has ended the span by then.
        if (handlerData.endTimestamp !== undefined) {
          releaseUnclaimedRequest(fetchData, url);
          return;
        }
        try {
          // The SDK attaches trace headers to matched URLs even with no active
          // span, or under one that has ended, naming a span that is never
          // sent: strip them, or point them at a running span. A claimed
          // request is pointed at its claimant.
          const activeSpan = getActiveSpan();
          const claimingSpan = getClaimingSpan(url);
          if (!claimingSpan) {
            trackUnclaimedRequest(fetchData, url);
          }
          let runningSpan = claimingSpan ?? getRunningSpan(activeSpan);
          if (
            runningSpan &&
            runningSpan !== activeSpan &&
            !retargetTraceHeaders(handlerData.args, runningSpan)
          ) {
            runningSpan = undefined;
          }
          if (!runningSpan) {
            const strippedHeaders = stripTraceHeaders(handlerData.args);
            if (strippedHeaders) {
              handlerData.args[1] = handlerData.args[1] || {};
              handlerData.args[1].headers = strippedHeaders;
            }
            return;
          }

          const requestId = requestIdProvider();
          currentConsensysRequestId = requestId;

          const traceId = getCurrentTraceId(runningSpan);
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
