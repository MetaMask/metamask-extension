import {
  BrowserClient,
  defaultStackParser,
  getCurrentScope,
  getTraceData,
  startSpan,
} from '@sentry/browser';

/**
 * Pins the SDK `traceparent` semantics trace propagation relies on, against
 * the real (unmocked) SDK: a deferred or negative sampling decision propagates
 * trace-flags `00` — a `01` would make OTLP backends record subtrees whose
 * advertised parent span never exists — and a recorded request span propagates
 * its *own* span id, so backend spans nest under the `http.client` span rather
 * than beside it. Flag-gating and target-scoping of header attachment are
 * covered separately by integration tests; these cover the header contents.
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
