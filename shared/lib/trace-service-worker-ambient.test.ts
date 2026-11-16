import * as Sentry from '@sentry/browser';
import { trace, trackServiceWorkerAmbientTrace, TraceName } from './trace';

// Real SDK, not mocks: with the pageload off, as in the service worker, the
// scope keeps the trace id it was created with for the worker's life.
describe('trace with no caller in the service worker (real SDK)', () => {
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

  // Starts a client with no pageload at `rate`; returns the scope's trace id.
  function startWorker(rate: number) {
    tracesSampler = jest.fn(
      ({ parentSampled }: { parentSampled?: boolean }) =>
        typeof parentSampled === 'boolean' ? Number(parentSampled) : rate,
    );
    const client = new Sentry.BrowserClient({
      dsn: 'https://public@example.ingest.sentry.io/1',
      transport: () => ({
        send: () => Promise.resolve({}),
        flush: () => Promise.resolve(true),
      }),
      stackParser: Sentry.defaultStackParser,
      tracesSampler,
      integrations: [
        Sentry.browserTracingIntegration({ instrumentPageLoad: false }),
      ],
    });
    Sentry.getCurrentScope().setClient(client);
    client.init();
    trackServiceWorkerAmbientTrace();
    expect(Sentry.getActiveSpan()).toBeUndefined();
    return Sentry.getCurrentScope().getPropagationContext().traceId;
  }

  function noCallerTrace() {
    return trace({ name: NO_CALLER }, (span) => ({
      traceId: (span as Sentry.Span).spanContext().traceId,
      recording: (span as Sentry.Span).isRecording(),
    }));
  }

  it('gives each no-caller trace its own trace id, drawn at its own rate', () => {
    asServiceWorker();
    const ambientTraceId = startWorker(1);

    const first = noCallerTrace();
    const second = noCallerTrace();

    expect(first.traceId).not.toBe(ambientTraceId);
    expect(second.traceId).not.toBe(first.traceId);
    expect(first.recording).toBe(true);
  });

  it('keeps the trace id of a running rooted span', () => {
    asServiceWorker();
    startWorker(1);

    const result = trace(
      { name: 'Background RPC: setAddressBook', root: true },
      (rpc) => ({
        rpcTraceId: (rpc as Sentry.Span).spanContext().traceId,
        ...noCallerTrace(),
      }),
    );

    expect(result.traceId).toBe(result.rpcTraceId);
  });
});
