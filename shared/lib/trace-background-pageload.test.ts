import * as Sentry from '@sentry/browser';
import { getEnvironmentType } from './environment-type';
import { trace, trackBackgroundPageloadEnd, TraceName } from './trace';

jest.mock('./environment-type', () => ({
  ...jest.requireActual('./environment-type'),
  getEnvironmentType: jest.fn(),
}));

// Real SDK, not mocks: `browserTracingIntegration` starts and ends the pageload
// and leaves its trace id and sampling decision on the scope, as it does in the
// background.
describe('trace with no caller after the background pageload ends (real SDK)', () => {
  // eslint-disable-next-line @typescript-eslint/naming-convention
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

  // The service worker (`/service-worker.js`) and Firefox's persistent
  // background page (`/background.html`) both resolve to the background.
  function inContext(pathname: string) {
    if (pathname === '/service-worker.js') {
      globals.ServiceWorkerGlobalScope = class {
        static [Symbol.hasInstance](instance: unknown) {
          return instance === globalThis;
        }
      };
    }
    const { getEnvironmentType: actual } =
      jest.requireActual('./environment-type');
    jest
      .mocked(getEnvironmentType)
      .mockImplementation(() => actual(`chrome-extension://id${pathname}`));
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
    trackBackgroundPageloadEnd(client);

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

  // @ts-expect-error This function is missing from the Mocha type definitions
  it.each([
    ['service worker, unsampled', '/service-worker.js', 0],
    ['service worker, sampled', '/service-worker.js', 1],
    ['Firefox background page, unsampled', '/background.html', 0],
    ['Firefox background page, sampled', '/background.html', 1],
  ])(
    'starts a new trace drawn at its own rate after the pageload (%s)',
    (_label: string, pathname: string, pageloadRate: number) => {
      inContext(pathname);
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
    inContext('/service-worker.js');
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

  it('does not track a document pageload', () => {
    inContext('/home.html');
    const pageloadTraceId = endPageload({ pageload: 0, noCaller: 1 });

    const result = noCallerTrace();

    expect(result.traceId).toBe(pageloadTraceId);
    expect(result.recording).toBe(false);
  });
});
