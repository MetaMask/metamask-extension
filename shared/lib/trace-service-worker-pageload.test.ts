import * as Sentry from '@sentry/browser';
import { trace, trackServiceWorkerPageloadEnd, TraceName } from './trace';

// Real SDK, not mocks: `browserTracingIntegration` starts and ends the pageload
// and leaves its trace id and sampling decision on the scope, as it does in the
// service worker.
describe('trace with no caller after the service-worker pageload ends (real SDK)', () => {
  const globals = globalThis as { ServiceWorkerGlobalScope?: unknown };
  const NO_CALLER = TraceName.ContactSyncUpdateRemote;

  let tracesSampler: jest.Mock;

  beforeAll(() => {
    const perf = globalThis.performance as unknown as Record<string, unknown>;
    perf.getEntriesByType ??= () => [];
    perf.getEntries ??= () => [];
    (globalThis as { sentry?: unknown }).sentry = Sentry;
  });

  afterEach(() => {
    delete globals.ServiceWorkerGlobalScope;
  });

  function asServiceWorker() {
    globals.ServiceWorkerGlobalScope = class {
      static [Symbol.hasInstance](instance: unknown) {
        return instance === globalThis;
      }
    };
  }

  /**
   * Start a client whose pageload and no-caller trace are drawn at the given
   * rates, then end the pageload.
   *
   * @param rates - Sample rates.
   * @param rates.pageload - Rate for the pageload.
   * @param rates.noCaller - Rate for the no-caller trace.
   * @returns The ended pageload's trace id.
   */
  function endPageload(rates: { pageload: number; noCaller: number }) {
    // Inherits a parent decision, as `createTracesSampler` does for a name
    // without an override.
    tracesSampler = jest.fn(
      ({ name, parentSampled }: { name: string; parentSampled?: boolean }) => {
        if (typeof parentSampled === 'boolean') {
          return parentSampled ? 1 : 0;
        }
        return name === NO_CALLER ? rates.noCaller : rates.pageload;
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
    trackServiceWorkerPageloadEnd(client);

    const pageload = Sentry.getActiveSpan() as Sentry.Span;
    expect(Sentry.spanToJSON(pageload).op).toBe('pageload');
    pageload.end();
    tracesSampler.mockClear();
    return pageload.spanContext().traceId;
  }

  function noCallerTrace() {
    return trace({ name: NO_CALLER }, (span) => ({
      traceId: (span as Sentry.Span).spanContext().traceId,
      recording: (span as Sentry.Span).isRecording(),
    }));
  }

  it.each([
    ['unsampled', 0],
    ['sampled', 1],
  ])(
    'starts a new trace drawn at its own rate after a %s pageload',
    (_label, pageloadRate) => {
      asServiceWorker();
      const noCallerRate = 1 - pageloadRate;
      const pageloadTraceId = endPageload({
        pageload: pageloadRate,
        noCaller: noCallerRate,
      });

      const result = noCallerTrace();

      expect(result.traceId).not.toBe(pageloadTraceId);
      expect(tracesSampler).toHaveBeenCalledWith(
        expect.objectContaining({ name: NO_CALLER, parentSampled: undefined }),
      );
      expect(result.recording).toBe(noCallerRate === 1);
    },
  );

  it('keeps the trace id of a running rooted span', () => {
    asServiceWorker();
    endPageload({ pageload: 0, noCaller: 1 });

    const result = trace(
      { name: 'Background RPC: setAddressBook', root: true },
      (rpc) => ({
        rpcTraceId: (rpc as Sentry.Span).spanContext().traceId,
        ...noCallerTrace(),
      }),
    );

    expect(result.traceId).toBe(result.rpcTraceId);
  });

  it('leaves a document pageload trace unchanged', () => {
    const pageloadTraceId = endPageload({ pageload: 0, noCaller: 1 });

    const result = noCallerTrace();

    expect(result.traceId).toBe(pageloadTraceId);
    expect(result.recording).toBe(false);
  });
});
