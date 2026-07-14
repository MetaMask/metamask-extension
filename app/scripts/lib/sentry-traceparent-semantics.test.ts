import {
  BrowserClient,
  defaultStackParser,
  getCurrentScope,
  getTraceData,
  startSpan,
} from '@sentry/browser';

/**
 * Pins the v10 SDK `traceparent` semantics this upgrade relies on, against the
 * real (unmocked) SDK. Complements #44053 (flag-gating + target-scoping of the
 * outbound headers); these tests cover the header *contents*:
 *
 * - A deferred sampling decision (no active span — the common case for
 * background service-worker fetches) must propagate trace-flags `00`, not
 * `01`. The pre-v10 manual injection propagated `01` here, which made OTLP
 * backends record subtrees whose advertised parent span never existed —
 * measured at 69% of backend `http.server` entry spans orphaned
 * (MetaMask-planning#7354).
 * - A recorded request span must propagate its *own* span id as the
 * traceparent parent, so backend spans nest under the `http.client` span
 * rather than beside it (the pre-v10 injection used the enclosing root,
 * producing sibling mis-nesting — the other 31%).
 */

const W3C_TRACEPARENT_UNSAMPLED = /^00-[0-9a-f]{32}-[0-9a-f]{16}-00$/u;

function initClient(tracesSampleRate: number): BrowserClient {
  const client = new BrowserClient({
    dsn: 'https://public@example.ingest.sentry.io/1',
    transport: () => ({
      send: () => Promise.resolve({}),
      flush: () => Promise.resolve(true),
    }),
    stackParser: defaultStackParser,
    integrations: [],
    tracesSampleRate,
  });
  getCurrentScope().setClient(client);
  client.init();
  return client;
}

describe('SDK traceparent semantics (propagateTraceparent)', () => {
  afterEach(() => {
    getCurrentScope().clear();
  });

  it('propagates trace-flags 00 when no span is active (deferred decision)', () => {
    initClient(1);
    const { traceparent } = getTraceData({ propagateTraceparent: true });
    expect(traceparent).toMatch(W3C_TRACEPARENT_UNSAMPLED);
  });

  it('propagates trace-flags 00 under a negatively sampled span', () => {
    initClient(0);
    startSpan({ name: 'unsampled operation' }, () => {
      const { traceparent } = getTraceData({ propagateTraceparent: true });
      expect(traceparent).toMatch(W3C_TRACEPARENT_UNSAMPLED);
    });
  });

  it('propagates the active sampled span id with trace-flags 01', () => {
    initClient(1);
    startSpan({ name: 'sampled operation' }, (span) => {
      const { traceId, spanId } = span.spanContext();
      const { traceparent } = getTraceData({ propagateTraceparent: true });
      expect(traceparent).toBe(`00-${traceId}-${spanId}-01`);
    });
  });

  it('propagates the request span id, not the enclosing root, when a span is provided', () => {
    initClient(1);
    startSpan({ name: 'custom root' }, (root) => {
      // Mirrors the fetch instrumentation, which passes the freshly created
      // `http.client` span to `getTraceData` rather than the active root.
      startSpan(
        { name: 'GET https://price.api.cx.metamask.io/v3/spot-prices' },
        (requestSpan) => {
          const { traceId, spanId } = requestSpan.spanContext();
          expect(spanId).not.toBe(root.spanContext().spanId);
          const { traceparent } = getTraceData({
            span: requestSpan,
            propagateTraceparent: true,
          });
          expect(traceparent).toBe(`00-${traceId}-${spanId}-01`);
        },
      );
    });
  });
});
