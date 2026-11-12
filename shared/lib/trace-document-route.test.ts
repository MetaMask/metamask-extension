import * as Sentry from '@sentry/browser';
import { trace, trackDocumentRouteTrace, TraceName } from './trace';

// Real SDK, not mocks: `browserTracingIntegration` starts the pageload, starts
// a navigation on `history.pushState`, and keeps each route's trace id and
// sampling decision on the scope until the next navigation, as it does in the
// extension's UI documents.
describe('trace with no caller in a UI document (real SDK)', () => {
  const NO_CALLER = TraceName.AccountList;

  let tracesSampler: jest.Mock;

  beforeAll(() => {
    const perf = globalThis.performance as unknown as Record<string, unknown>;
    perf.getEntriesByType ??= () => [];
    perf.getEntries ??= () => [];
    (globalThis as { sentry?: unknown }).sentry = Sentry;
  });

  // Starts a client drawing route spans and the no-caller trace at these rates.
  function startDocument(rates: { route: number; noCaller: number }) {
    // Inherits a parent decision, as `createTracesSampler` does for a name
    // without an override.
    tracesSampler = jest.fn(
      ({ name, parentSampled }: { name: string; parentSampled?: boolean }) => {
        if (typeof parentSampled === 'boolean') {
          return parentSampled ? 1 : 0;
        }
        return name === NO_CALLER ? rates.noCaller : rates.route;
      },
    );
    const client = new Sentry.BrowserClient({
      dsn: 'https://public@example.ingest.sentry.io/1',
      transport: () => ({
        send: () => Promise.resolve({}),
        flush: () => Promise.resolve(true),
      }),
      stackParser: Sentry.defaultStackParser,
      tracesSampler,
      integrations: [Sentry.browserTracingIntegration()],
    });
    Sentry.getCurrentScope().setClient(client);
    client.init();
    trackDocumentRouteTrace(client);

    const pageload = Sentry.getActiveSpan() as Sentry.Span;
    expect(Sentry.spanToJSON(pageload).op).toBe('pageload');
    return pageload;
  }

  function scopeTraceId() {
    return Sentry.getCurrentScope().getPropagationContext().traceId;
  }

  function noCallerTrace() {
    tracesSampler.mockClear();
    return trace({ name: NO_CALLER }, (span) => ({
      traceId: (span as Sentry.Span).spanContext().traceId,
      recording: (span as Sentry.Span).isRecording(),
    }));
  }

  function expectOwnDraw() {
    expect(tracesSampler).toHaveBeenCalledWith(
      expect.objectContaining({ name: NO_CALLER, parentSampled: undefined }),
    );
  }

  it('starts a new trace while the pageload is running', () => {
    const pageload = startDocument({ route: 1, noCaller: 0 });

    const result = noCallerTrace();

    expect(result.traceId).not.toBe(pageload.spanContext().traceId);
    expectOwnDraw();
    expect(result.recording).toBe(false);
  });

  it.each([
    ['unsampled', 0],
    ['sampled', 1],
  ])(
    'starts a new trace drawn at its own rate after a %s pageload ends',
    (_label, routeRate) => {
      const noCallerRate = 1 - routeRate;
      const pageload = startDocument({
        route: routeRate,
        noCaller: noCallerRate,
      });
      pageload.end();
      expect(scopeTraceId()).toBe(pageload.spanContext().traceId);

      const result = noCallerTrace();

      expect(result.traceId).not.toBe(pageload.spanContext().traceId);
      expectOwnDraw();
      expect(result.recording).toBe(noCallerRate === 1);
    },
  );

  it('starts a new trace on the route of an in-app navigation', () => {
    const pageload = startDocument({ route: 0, noCaller: 1 });
    pageload.end();

    globalThis.history.pushState({}, '', '#/send');
    const navigation = Sentry.getActiveSpan() as Sentry.Span;
    expect(Sentry.spanToJSON(navigation).op).toBe('navigation');
    navigation.end();
    // The SDK moves the scope to a new trace on navigation.
    expect(scopeTraceId()).toBe(navigation.spanContext().traceId);
    expect(scopeTraceId()).not.toBe(pageload.spanContext().traceId);

    const result = noCallerTrace();

    expect(result.traceId).not.toBe(navigation.spanContext().traceId);
    expectOwnDraw();
    expect(result.recording).toBe(true);
  });

  it('keeps a no-caller trace inside a rooted operation on that operation', () => {
    const pageload = startDocument({ route: 0, noCaller: 1 });
    pageload.end();

    const result = trace(
      { name: TraceName.AccountOverviewAssetListTab, root: true },
      (op) => ({
        opTraceId: (op as Sentry.Span).spanContext().traceId,
        ...noCallerTrace(),
      }),
    );

    expect(result.traceId).toBe(result.opTraceId);
    expect(result.traceId).not.toBe(pageload.spanContext().traceId);
  });

  it('nests a trace with a resolved parent under that parent', () => {
    // A sampled operation, so its child records a parent span id.
    const pageload = startDocument({ route: 1, noCaller: 1 });
    pageload.end();

    const result = trace(
      { name: TraceName.AccountOverviewAssetListTab, root: true },
      (op) =>
        trace(
          { name: NO_CALLER, parentContext: op as Sentry.Span },
          (child) => ({
            opSpanId: (op as Sentry.Span).spanContext().spanId,
            opTraceId: (op as Sentry.Span).spanContext().traceId,
            traceId: (child as Sentry.Span).spanContext().traceId,
            parentSpanId: Sentry.spanToJSON(child as Sentry.Span)
              .parent_span_id,
          }),
        ),
    );

    expect(result.traceId).toBe(result.opTraceId);
    expect(result.parentSpanId).toBe(result.opSpanId);
  });
});
