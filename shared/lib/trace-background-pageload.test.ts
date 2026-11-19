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

  describe('with a declared parentContext', () => {
    // The shape `serializeTraceContext` writes, which crosses process
    // boundaries; the underscore names are that contract.
    function serialized(name: string, id?: string, traceparent?: string) {
      return {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        _name: name,
        // eslint-disable-next-line @typescript-eslint/naming-convention
        ...(id && { _id: id }),
        ...(traceparent && { traceparent }),
      };
    }

    function childTrace(parentContext: unknown) {
      return trace(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        { name: NO_CALLER, parentContext: parentContext as any },
        (span) => (span as Sentry.Span).spanContext().traceId,
      );
    }

    // @ts-expect-error This function is missing from the Mocha type definitions
    it.each([
      ['an ended serialized context', serialized('Ended Trace', 'gone')],
      ['null', null],
    ])(
      'starts a new trace when the parent does not resolve (%s)',
      (_label: string, parentContext: unknown) => {
        inContext('/service-worker.js');
        const pageloadTraceId = endPageload({ pageload: 0, noCaller: 1 });

        expect(childTrace(parentContext)).not.toBe(pageloadTraceId);
      },
    );

    it('nests under a parent that resolves', () => {
      inContext('/service-worker.js');
      const pageloadTraceId = endPageload({ pageload: 0, noCaller: 1 });
      const parent = trace({ name: TraceName.Middleware, root: true });

      const childTraceId = childTrace(parent);

      expect(childTraceId).toBe((parent as Sentry.Span).spanContext().traceId);
      expect(childTraceId).not.toBe(pageloadTraceId);
    });

    it('continues the trace of an unresolved context that keeps its traceparent', () => {
      inContext('/service-worker.js');
      endPageload({ pageload: 0, noCaller: 1 });
      const traceId = 'a'.repeat(32);

      expect(
        childTrace(
          serialized(
            'Ended Trace',
            undefined,
            `00-${traceId}-${'b'.repeat(16)}-01`,
          ),
        ),
      ).toBe(traceId);
    });

    it('nests under the active span when the parent does not resolve', () => {
      inContext('/service-worker.js');
      endPageload({ pageload: 0, noCaller: 1 });

      const result = trace(
        { name: 'Background RPC: setAddressBook', root: true },
        (rpc) => ({
          rpcTraceId: (rpc as Sentry.Span).spanContext().traceId,
          childTraceId: childTrace(serialized('Ended Trace', 'gone')),
        }),
      );

      expect(result.childTraceId).toBe(result.rpcTraceId);
    });
  });

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

  describe('under an active span from another trace', () => {
    // The span is made in a trace of its own and activated on a fork of the
    // current scope, which keeps the ended pageload's trace id in its
    // propagation context, as the controllers' spans do in the background.
    function withOtherTraceActive<Result>(
      callback: (otherTraceId: string) => Result,
    ) {
      const other = Sentry.startNewTrace(() =>
        Sentry.startInactiveSpan({ name: 'Other Trace' }),
      );
      return Sentry.withActiveSpan(other, () =>
        callback(other.spanContext().traceId),
      );
    }

    it('starts a new trace instead of taking the ended pageload trace id', () => {
      inContext('/service-worker.js');
      const pageloadTraceId = endPageload({ pageload: 0, noCaller: 1 });

      const result = withOtherTraceActive((otherTraceId) => ({
        otherTraceId,
        ...noCallerTrace(),
      }));

      expect(result.traceId).not.toBe(pageloadTraceId);
      expect(result.traceId).not.toBe(result.otherTraceId);
      expect(result.recording).toBe(true);
    });

    it('nests under the active span when allowActiveSpanFallback is set', () => {
      inContext('/service-worker.js');
      const pageloadTraceId = endPageload({ pageload: 0, noCaller: 1 });

      const result = withOtherTraceActive((otherTraceId) => ({
        otherTraceId,
        traceId: trace(
          { name: NO_CALLER, allowActiveSpanFallback: true },
          (span) => (span as Sentry.Span).spanContext().traceId,
        ),
      }));

      expect(result.traceId).toBe(result.otherTraceId);
      expect(result.traceId).not.toBe(pageloadTraceId);
    });
  });

  it('leaves a document pageload trace unchanged', () => {
    inContext('/home.html');
    const pageloadTraceId = endPageload({ pageload: 0, noCaller: 1 });

    const result = noCallerTrace();

    expect(result.traceId).toBe(pageloadTraceId);
    expect(result.recording).toBe(false);
  });
});
