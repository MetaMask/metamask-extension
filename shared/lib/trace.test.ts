import * as Sentry from '@sentry/browser';
import { endTrace, trace, TraceName, getSerializedTraceContext } from './trace';

jest.replaceProperty(global, 'sentry', {
  withIsolationScope: jest.fn(),
  startSpan: jest.fn(),
  startSpanManual: jest.fn(),
  setMeasurement: jest.fn(),
  getActiveSpan: jest.fn(),
  continueTrace: jest.fn(),
});

const {
  setMeasurement,
  startSpan,
  startSpanManual,
  withIsolationScope,
  getActiveSpan,
  continueTrace,
} = global.sentry as typeof Sentry;

const NAME_MOCK = TraceName.Transaction;
const ID_MOCK = 'testId';
const PARENT_CONTEXT_MOCK = {
  spanContext: jest.fn(),
} as unknown as Sentry.Span;

const TAGS_MOCK = {
  tag1: 'value1',
  tag2: true,
  tag3: 123,
};

const DATA_MOCK = {
  data1: 'value1',
  data2: true,
  data3: 123,
};

describe('Trace', () => {
  const startSpanMock = jest.mocked(startSpan);
  const startSpanManualMock = jest.mocked(startSpanManual);
  const withIsolationScopeMock = jest.mocked(withIsolationScope);
  const setMeasurementMock = jest.mocked(setMeasurement);
  const getActiveSpanMock = jest.mocked(getActiveSpan);
  const continueTraceMock = jest.mocked(continueTrace);
  const setTagMock = jest.fn();

  beforeEach(() => {
    jest.resetAllMocks();

    globalThis.sentry = {
      startSpan: startSpanMock,
      startSpanManual: startSpanManualMock,
      withIsolationScope: withIsolationScopeMock,
      setMeasurement: setMeasurementMock,
      getActiveSpan: getActiveSpanMock,
      continueTrace: continueTraceMock,
    };

    startSpanMock.mockImplementation((_, fn) => fn({} as Sentry.Span));

    startSpanManualMock.mockImplementation((_, fn) =>
      fn({} as Sentry.Span, () => {
        // Intentionally empty
      }),
    );

    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31973
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    withIsolationScopeMock.mockImplementation((fn: any) =>
      fn({ setTag: setTagMock }),
    );
  });

  describe('trace', () => {
    it('executes callback', () => {
      let callbackExecuted = false;

      trace({ name: NAME_MOCK }, () => {
        callbackExecuted = true;
      });

      expect(callbackExecuted).toBe(true);
    });

    it('returns value from callback', () => {
      const result = trace({ name: NAME_MOCK }, () => true);
      expect(result).toBe(true);
    });

    it('invokes Sentry if callback provided', () => {
      trace(
        {
          name: NAME_MOCK,
          tags: TAGS_MOCK,
          data: DATA_MOCK,
          parentContext: PARENT_CONTEXT_MOCK,
        },
        () => true,
      );

      expect(withIsolationScopeMock).toHaveBeenCalledTimes(1);

      expect(startSpanMock).toHaveBeenCalledTimes(1);
      expect(startSpanMock).toHaveBeenCalledWith(
        {
          name: NAME_MOCK,
          parentSpan: PARENT_CONTEXT_MOCK,
          attributes: DATA_MOCK,
          op: 'custom',
        },
        expect.any(Function),
      );

      expect(setTagMock).toHaveBeenCalledTimes(2);
      expect(setTagMock).toHaveBeenCalledWith('tag1', 'value1');
      expect(setTagMock).toHaveBeenCalledWith('tag2', true);

      expect(setMeasurementMock).toHaveBeenCalledTimes(1);
      expect(setMeasurementMock).toHaveBeenCalledWith('tag3', 123, 'none');
    });

    it('invokes Sentry if no callback provided', () => {
      trace({
        id: ID_MOCK,
        name: NAME_MOCK,
        tags: TAGS_MOCK,
        data: DATA_MOCK,
        parentContext: PARENT_CONTEXT_MOCK,
      });

      expect(withIsolationScopeMock).toHaveBeenCalledTimes(1);

      expect(startSpanManualMock).toHaveBeenCalledTimes(1);
      expect(startSpanManualMock).toHaveBeenCalledWith(
        {
          name: NAME_MOCK,
          parentSpan: PARENT_CONTEXT_MOCK,
          attributes: DATA_MOCK,
          op: 'custom',
        },
        expect.any(Function),
      );

      expect(setTagMock).toHaveBeenCalledTimes(2);
      expect(setTagMock).toHaveBeenCalledWith('tag1', 'value1');
      expect(setTagMock).toHaveBeenCalledWith('tag2', true);

      expect(setMeasurementMock).toHaveBeenCalledTimes(1);
      expect(setMeasurementMock).toHaveBeenCalledWith('tag3', 123, 'none');
    });

    it('invokes Sentry if no callback provided with custom start time', () => {
      trace({
        id: ID_MOCK,
        name: NAME_MOCK,
        tags: TAGS_MOCK,
        data: DATA_MOCK,
        parentContext: PARENT_CONTEXT_MOCK,
        startTime: 123,
      });

      expect(withIsolationScopeMock).toHaveBeenCalledTimes(1);

      expect(startSpanManualMock).toHaveBeenCalledTimes(1);
      expect(startSpanManualMock).toHaveBeenCalledWith(
        {
          name: NAME_MOCK,
          parentSpan: PARENT_CONTEXT_MOCK,
          attributes: DATA_MOCK,
          op: 'custom',
          startTime: 123,
        },
        expect.any(Function),
      );

      expect(setTagMock).toHaveBeenCalledTimes(2);
      expect(setTagMock).toHaveBeenCalledWith('tag1', 'value1');
      expect(setTagMock).toHaveBeenCalledWith('tag2', true);

      expect(setMeasurementMock).toHaveBeenCalledTimes(1);
      expect(setMeasurementMock).toHaveBeenCalledWith('tag3', 123, 'none');
    });

    it('supports no global Sentry object', () => {
      globalThis.sentry = undefined;

      let callbackExecuted = false;

      trace(
        {
          name: NAME_MOCK,
          tags: TAGS_MOCK,
          data: DATA_MOCK,
          parentContext: PARENT_CONTEXT_MOCK,
          startTime: 123,
        },
        () => {
          callbackExecuted = true;
        },
      );

      expect(callbackExecuted).toBe(true);
    });

    it('resolves parent span from { _name, _id } object', () => {
      const spanEndMock = jest.fn();
      const parentSpanMock = {
        end: spanEndMock,
        spanContext: jest.fn(),
      } as unknown as Sentry.Span;

      startSpanManualMock.mockImplementationOnce((_, fn) =>
        fn(parentSpanMock, () => {
          // Intentionally empty
        }),
      );

      trace({
        name: TraceName.Transaction,
        id: 'parent-id',
      });

      trace(
        {
          name: TraceName.Middleware,
          // eslint-disable-next-line @typescript-eslint/naming-convention
          parentContext: { _name: TraceName.Transaction, _id: 'parent-id' },
        },
        () => true,
      );

      expect(startSpanMock).toHaveBeenCalledWith(
        expect.objectContaining({
          parentSpan: parentSpanMock,
        }),
        expect.any(Function),
      );
    });

    it('resolves parent span from { _name } object with default ID', () => {
      const spanEndMock = jest.fn();
      const parentSpanMock = {
        end: spanEndMock,
        spanContext: jest.fn(),
      } as unknown as Sentry.Span;

      startSpanManualMock.mockImplementationOnce((_, fn) =>
        fn(parentSpanMock, () => {
          // Intentionally empty
        }),
      );

      trace({
        name: TraceName.Transaction,
      });

      trace(
        {
          name: TraceName.Middleware,
          // eslint-disable-next-line @typescript-eslint/naming-convention
          parentContext: { _name: TraceName.Transaction },
        },
        () => true,
      );

      expect(startSpanMock).toHaveBeenCalledWith(
        expect.objectContaining({
          parentSpan: parentSpanMock,
        }),
        expect.any(Function),
      );
    });
  });

  describe('endTrace', () => {
    it('ends Sentry span matching name and specified ID', () => {
      const spanEndMock = jest.fn();
      const spanMock = { end: spanEndMock } as unknown as Sentry.Span;

      startSpanManualMock.mockImplementationOnce((_, fn) =>
        fn(spanMock, () => {
          // Intentionally empty
        }),
      );

      trace({
        name: NAME_MOCK,
        id: ID_MOCK,
        tags: TAGS_MOCK,
        data: DATA_MOCK,
        parentContext: PARENT_CONTEXT_MOCK,
      });

      endTrace({ name: NAME_MOCK, id: ID_MOCK });

      expect(spanEndMock).toHaveBeenCalledTimes(1);
    });

    it('ends Sentry span matching name and default ID', () => {
      const spanEndMock = jest.fn();
      const spanMock = { end: spanEndMock } as unknown as Sentry.Span;

      startSpanManualMock.mockImplementationOnce((_, fn) =>
        fn(spanMock, () => {
          // Intentionally empty
        }),
      );

      trace({
        name: NAME_MOCK,
        tags: TAGS_MOCK,
        data: DATA_MOCK,
        parentContext: PARENT_CONTEXT_MOCK,
      });

      endTrace({ name: NAME_MOCK });

      expect(spanEndMock).toHaveBeenCalledTimes(1);
    });

    it('ends Sentry span with custom timestamp', () => {
      const spanEndMock = jest.fn();
      const spanMock = { end: spanEndMock } as unknown as Sentry.Span;

      startSpanManualMock.mockImplementationOnce((_, fn) =>
        fn(spanMock, () => {
          // Intentionally empty
        }),
      );

      trace({
        name: NAME_MOCK,
        id: ID_MOCK,
        tags: TAGS_MOCK,
        data: DATA_MOCK,
        parentContext: PARENT_CONTEXT_MOCK,
      });

      endTrace({ name: NAME_MOCK, id: ID_MOCK, timestamp: 123 });

      expect(spanEndMock).toHaveBeenCalledTimes(1);
      expect(spanEndMock).toHaveBeenCalledWith(123);
    });

    it('does not end Sentry span if name and ID does not match', () => {
      const spanEndMock = jest.fn();
      const spanMock = { end: spanEndMock } as unknown as Sentry.Span;

      startSpanManualMock.mockImplementationOnce((_, fn) =>
        fn(spanMock, () => {
          // Intentionally empty
        }),
      );

      trace({
        name: NAME_MOCK,
        id: ID_MOCK,
        tags: TAGS_MOCK,
        data: DATA_MOCK,
        parentContext: PARENT_CONTEXT_MOCK,
      });

      endTrace({ name: NAME_MOCK, id: 'invalidId' });

      expect(spanEndMock).toHaveBeenCalledTimes(0);
    });

    it('supports no global Sentry object', () => {
      globalThis.sentry = undefined;

      expect(() => {
        trace({
          name: NAME_MOCK,
          id: ID_MOCK,
          tags: TAGS_MOCK,
          data: DATA_MOCK,
          parentContext: PARENT_CONTEXT_MOCK,
        });

        endTrace({ name: NAME_MOCK, id: ID_MOCK });
      }).not.toThrow();
    });
  });

  describe('getActiveSpan fallback', () => {
    it('inherits from active span when no parentContext provided', () => {
      const activeSpanMock = {
        spanContext: jest.fn().mockReturnValue({
          traceId: 'abc123',
          spanId: 'def456',
        }),
      } as unknown as Sentry.Span;

      getActiveSpanMock.mockReturnValue(activeSpanMock);

      trace({ name: NAME_MOCK }, () => true);

      expect(getActiveSpanMock).toHaveBeenCalledTimes(1);
      expect(startSpanMock).toHaveBeenCalledWith(
        expect.objectContaining({
          parentSpan: activeSpanMock,
        }),
        expect.any(Function),
      );
    });

    it('does not call getActiveSpan when parentContext is provided', () => {
      trace(
        { name: NAME_MOCK, parentContext: PARENT_CONTEXT_MOCK },
        () => true,
      );

      expect(getActiveSpanMock).not.toHaveBeenCalled();
    });

    it('uses null parentSpan when no active span and no parentContext', () => {
      getActiveSpanMock.mockReturnValue(undefined);

      trace({ name: NAME_MOCK }, () => true);

      expect(startSpanMock).toHaveBeenCalledWith(
        expect.objectContaining({
          parentSpan: null,
        }),
        expect.any(Function),
      );
    });
  });

  describe('cross-process trace context (continueTrace)', () => {
    it('uses continueTrace when parentContext has _traceId and _spanId', () => {
      continueTraceMock.mockImplementation((_opts, fn) => fn());

      trace(
        {
          name: NAME_MOCK,
          // eslint-disable-next-line @typescript-eslint/naming-convention
          parentContext: { _traceId: 'trace123', _spanId: 'span456' },
        },
        () => true,
      );

      expect(continueTraceMock).toHaveBeenCalledTimes(1);
      expect(continueTraceMock).toHaveBeenCalledWith(
        { sentryTrace: 'trace123-span456-1', baggage: undefined },
        expect.any(Function),
      );
    });

    it('passes parentSpan as undefined inside continueTrace callback', () => {
      continueTraceMock.mockImplementation((_opts, fn) => fn());

      trace(
        {
          name: NAME_MOCK,
          // eslint-disable-next-line @typescript-eslint/naming-convention
          parentContext: { _traceId: 'trace123', _spanId: 'span456' },
        },
        () => true,
      );

      expect(startSpanMock).toHaveBeenCalledWith(
        expect.objectContaining({
          parentSpan: undefined,
        }),
        expect.any(Function),
      );
    });

    it('falls back to map lookup when _name is also present', () => {
      const spanEndMock = jest.fn();
      const parentSpanMock = {
        end: spanEndMock,
        spanContext: jest.fn(),
      } as unknown as Sentry.Span;

      startSpanManualMock.mockImplementationOnce((_, fn) =>
        fn(parentSpanMock, () => {
          // Intentionally empty
        }),
      );

      // Create a pending trace
      trace({ name: TraceName.Transaction, id: 'parent-id' });

      // Use serialized context with _name (for map lookup) and _traceId/_spanId
      trace(
        {
          name: TraceName.Middleware,
          parentContext: {
            // eslint-disable-next-line @typescript-eslint/naming-convention
            _name: TraceName.Transaction,
            // eslint-disable-next-line @typescript-eslint/naming-convention
            _id: 'parent-id',
            // eslint-disable-next-line @typescript-eslint/naming-convention
            _traceId: 'trace123',
            // eslint-disable-next-line @typescript-eslint/naming-convention
            _spanId: 'span456',
          },
        },
        () => true,
      );

      // Should use map lookup result, not continueTrace
      expect(continueTraceMock).not.toHaveBeenCalled();
      expect(startSpanMock).toHaveBeenCalledWith(
        expect.objectContaining({
          parentSpan: parentSpanMock,
        }),
        expect.any(Function),
      );
    });
  });

  describe('getSerializedTraceContext', () => {
    it('returns undefined when no active span', () => {
      getActiveSpanMock.mockReturnValue(undefined);
      expect(getSerializedTraceContext()).toBeUndefined();
    });

    it('returns traceId and spanId from active span', () => {
      const activeSpanMock = {
        spanContext: jest.fn().mockReturnValue({
          traceId: 'abc123',
          spanId: 'def456',
        }),
      } as unknown as Sentry.Span;

      getActiveSpanMock.mockReturnValue(activeSpanMock);

      /* eslint-disable @typescript-eslint/naming-convention */
      expect(getSerializedTraceContext()).toStrictEqual({
        _traceId: 'abc123',
        _spanId: 'def456',
      });
      /* eslint-enable @typescript-eslint/naming-convention */
    });

    it('returns undefined when sentry is not initialized', () => {
      globalThis.sentry = undefined;
      expect(getSerializedTraceContext()).toBeUndefined();
    });
  });
});

describe('concurrent trace() calls (MetaMask-planning#7523)', () => {
  // startSpan() wraps every span in sentryWithIsolationScope(), which --
  // per @sentry/browser's stack-based async-context strategy (no
  // AsyncLocalStorage/Zone equivalent exists in a browser/service-worker
  // realm) -- pushes onto a single, shared, mutable stack
  // (node_modules/@sentry/core/.../asyncContext/stackStrategy.js). That
  // stack has no concept of which logical async operation a frame belongs
  // to; it only knows push order. When two trace() calls overlap (ordinary
  // event-loop behavior for concurrent RPC handlers,
  // wrapMessengerWithTracing calls, or websocket notification handling in
  // the service worker), a later call's layer can still be on top when an
  // earlier, still-pending call's own continuation resumes and reads "the
  // current active span" -- misattributing it to the wrong operation.
  //
  // These tests exercise the real @sentry/browser SDK end-to-end (a real
  // BrowserClient, globalThis.sentry wired to the real SDK -- the same
  // pattern used in app/scripts/lib/sentry-traceparent-semantics.test.ts)
  // instead of this file's default globalThis.sentry mock, because the
  // defect lives inside the SDK's real AsyncContextStack, not in trace.ts's
  // own logic in isolation.

  function deferred<Value = void>() {
    let resolve!: (value: Value) => void;
    const promise = new Promise<Value>((res) => {
      resolve = res;
    });
    return { promise, resolve };
  }

  function initRealSentryClient(): void {
    const client = new Sentry.BrowserClient({
      dsn: 'https://public@example.ingest.sentry.io/1',
      transport: () => ({
        send: () => Promise.resolve({}),
        flush: () => Promise.resolve(true),
      }),
      stackParser: Sentry.defaultStackParser,
      integrations: [],
      tracesSampleRate: 1,
    });
    Sentry.getCurrentScope().setClient(client);
    client.init();
    globalThis.sentry = { ...Sentry } as typeof globalThis.sentry;
  }

  // Steps N microtask ticks so pending `.then()` continuations settle in
  // order. Nothing here is time-based -- it's purely promise-resolution
  // order -- so this uses plain microtask stepping rather than fake timers.
  async function tick(times = 1) {
    for (let i = 0; i < times; i += 1) {
      await Promise.resolve();
    }
  }

  beforeEach(() => {
    initRealSentryClient();
  });

  afterEach(() => {
    Sentry.getCurrentScope().clear();
    Sentry.getIsolationScope().clear();
  });

  describe('when two trace() calls run sequentially', () => {
    it('does not parent the second span under the first', async () => {
      await trace(
        { name: NAME_MOCK, id: 'A-sequential' },
        async () => undefined,
      );
      const spanB = await trace({ name: NAME_MOCK, id: 'B-sequential' }, () =>
        Sentry.getActiveSpan(),
      );

      expect(spanB).toBeTruthy();
      expect(
        spanB && Sentry.spanToJSON(spanB).parent_span_id,
      ).toBeUndefined();
    });
  });

  describe('when a second, unrelated trace() call starts while the first is still pending', () => {
    // Bug confirmed via this harness; not yet fixed -- see
    // MetaMask-planning#7523. Skipped (rather than left red) so CI doesn't
    // fail with no explanation. Remove `.skip` to see it fail today:
    // `spanB`'s parent_span_id resolves to A's span id and its trace id to
    // A's, instead of being an independent root span. Once a fix lands
    // (candidate directions are in the ticket), remove `.skip` -- if it's
    // still red at that point, the fix is incomplete.
    // eslint-disable-next-line jest/no-disabled-tests
    it.skip('does not parent the second span under the still-pending first one', async () => {
      const aGate = deferred<void>();
      let spanA: Sentry.Span | null | undefined;

      // A's callback awaits an unresolved promise, so its isolation-scope
      // and current-scope layers stay on the SDK's shared
      // AsyncContextStack for as long as aGate is unresolved.
      const aPromise = trace({ name: NAME_MOCK, id: 'A-pending' }, async () => {
        spanA = Sentry.getActiveSpan();
        await aGate.promise;
        return spanA;
      });

      // Sanity check: confirm A really pushed a span onto the real stack
      // before relying on it -- otherwise this test would prove nothing.
      expect(spanA).toBeTruthy();

      try {
        // B is a logically unrelated trace() call (no parentContext) issued
        // while A is still pending.
        let spanB: Sentry.Span | null | undefined;
        const bPromise = trace(
          { name: NAME_MOCK, id: 'B-concurrent-unrelated' },
          () => {
            spanB = Sentry.getActiveSpan();
            return spanB;
          },
        );
        await tick(3);

        expect(spanB).toBeTruthy();
        expect(
          spanB && Sentry.spanToJSON(spanB).parent_span_id,
        ).toBeUndefined();
        expect(spanB?.spanContext().traceId).not.toBe(
          spanA?.spanContext().traceId,
        );

        await bPromise;
      } finally {
        aGate.resolve();
        await aPromise;
      }
    });

    // Same reasoning as above: skipped, not deleted or left red. Remove
    // `.skip` to see it fail today: `spanC` resolves under B's (already
    // corrupted) lineage instead of being independent.
    // eslint-disable-next-line jest/no-disabled-tests
    it.skip('does not let a third concurrent call inherit an already-corrupted lineage', async () => {
      const aGate = deferred<void>();
      const bGate = deferred<void>();

      let spanA: Sentry.Span | null | undefined;
      const aPromise = trace(
        { name: NAME_MOCK, id: 'A-pending-2' },
        async () => {
          spanA = Sentry.getActiveSpan();
          await aGate.promise;
          return spanA;
        },
      );

      let spanB: Sentry.Span | null | undefined;
      const bPromise = trace(
        { name: NAME_MOCK, id: 'B-pending-2' },
        async () => {
          spanB = Sentry.getActiveSpan();
          await bGate.promise;
          return spanB;
        },
      );

      try {
        let spanC: Sentry.Span | null | undefined;
        const cPromise = trace(
          { name: NAME_MOCK, id: 'C-concurrent-2' },
          () => {
            spanC = Sentry.getActiveSpan();
            return spanC;
          },
        );
        await tick(3);

        expect(spanA).toBeTruthy();
        expect(spanB).toBeTruthy();
        expect(spanC).toBeTruthy();

        expect(
          spanC && Sentry.spanToJSON(spanC).parent_span_id,
        ).toBeUndefined();
        expect(spanC?.spanContext().traceId).not.toBe(
          spanB?.spanContext().traceId,
        );

        await cPromise;
      } finally {
        bGate.resolve();
        await bPromise;
        aGate.resolve();
        await aPromise;
      }
    });
  });
});
