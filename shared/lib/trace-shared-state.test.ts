import * as Sentry from '@sentry/browser';
import { getEnvironmentType } from './environment-type';

jest.mock('./environment-type', () => ({
  ...jest.requireActual('./environment-type'),
  getEnvironmentType: jest.fn(),
}));

type TraceModule = typeof import('./trace');

// A real build bundles `trace.ts` into more than one module instance in the
// service worker: the self-contained `service-worker.js` entry carries a copy
// through `setupSentry`, and the chunk that `background` is loaded from carries
// another. Each instance has its own module-level variables. Jest normally
// loads one instance, so these tests load two, as the build does.
describe('trace state shared across module instances', () => {
  // eslint-disable-next-line @typescript-eslint/naming-convention
  const globals = globalThis as { ServiceWorkerGlobalScope?: unknown };
  const globalWithHooks = globalThis as { stateHooks?: unknown };

  function loadInstance(): TraceModule {
    let instance: TraceModule | undefined;
    jest.isolateModules(() => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      instance = require('./trace');
    });
    return instance as TraceModule;
  }

  beforeAll(() => {
    const perf = globalThis.performance as unknown as Record<string, unknown>;
    perf.getEntriesByType ??= () => [];
    perf.getEntries ??= () => [];
    (globalThis as { sentry?: unknown }).sentry = Sentry;
  });

  beforeEach(() => {
    // `bootstrap.ts` creates this object before any copy of the module runs.
    globalWithHooks.stateHooks = {};
    globals.ServiceWorkerGlobalScope = class {
      static [Symbol.hasInstance](instance: unknown) {
        return instance === globalThis;
      }
    };
    const { getEnvironmentType: actual } =
      jest.requireActual('./environment-type');
    jest
      .mocked(getEnvironmentType)
      .mockImplementation(() =>
        actual('chrome-extension://id/service-worker.js'),
      );
  });

  afterEach(() => {
    delete globals.ServiceWorkerGlobalScope;
    delete globalWithHooks.stateHooks;
  });

  it('lets trace() in one instance see the pageload end recorded by another', () => {
    // The instance `setupSentry` calls, and the instance every caller uses.
    const setupSentryInstance = loadInstance();
    const callerInstance = loadInstance();
    expect(setupSentryInstance).not.toBe(callerInstance);

    const client = new Sentry.BrowserClient({
      dsn: 'https://public@example.ingest.sentry.io/1',
      transport: () => ({
        send: () => Promise.resolve({}),
        flush: () => Promise.resolve(true),
      }),
      stackParser: Sentry.defaultStackParser,
      tracesSampleRate: 1,
      integrations: [Sentry.browserTracingIntegration()],
    });
    Sentry.getCurrentScope().setClient(client);
    client.init();
    setupSentryInstance.trackBackgroundPageload(client);

    const pageload = Sentry.getActiveSpan() as Sentry.Span;
    expect(Sentry.spanToJSON(pageload).op).toBe('pageload');
    pageload.end();
    const endedTraceId = pageload.spanContext().traceId;

    const traceId = callerInstance.trace(
      { name: callerInstance.TraceName.ContactSyncUpdateRemote },
      (span) => (span as Sentry.Span).spanContext().traceId,
    );

    expect(traceId).not.toBe(endedTraceId);
  });
});
