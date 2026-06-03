import type * as Sentry from '@sentry/browser';
import {
  endTrace,
  trace,
  TraceName,
  getSerializedTraceContext,
  serializeTraceContext,
} from './trace';

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

  describe('serializeTraceContext', () => {
    it('includes name and id from request', () => {
      const result = serializeTraceContext(null, {
        name: 'Test',
        id: 'test-id',
      });
      // eslint-disable-next-line @typescript-eslint/naming-convention
      expect(result).toStrictEqual({ _name: 'Test', _id: 'test-id' });
    });

    it('includes traceId and spanId from span', () => {
      const spanMock = {
        spanContext: jest.fn().mockReturnValue({
          traceId: 'trace789',
          spanId: 'span012',
        }),
      } as unknown as Sentry.Span;

      const result = serializeTraceContext(spanMock, { name: 'Test' });
      expect(result).toStrictEqual({
        // eslint-disable-next-line @typescript-eslint/naming-convention
        _name: 'Test',
        // eslint-disable-next-line @typescript-eslint/naming-convention
        _id: undefined,
        // eslint-disable-next-line @typescript-eslint/naming-convention
        _traceId: 'trace789',
        // eslint-disable-next-line @typescript-eslint/naming-convention
        _spanId: 'span012',
      });
    });

    it('handles span that throws on spanContext', () => {
      const spanMock = {
        spanContext: jest.fn().mockImplementation(() => {
          throw new Error('span ended');
        }),
      } as unknown as Sentry.Span;

      const result = serializeTraceContext(spanMock, { name: 'Test' });
      // eslint-disable-next-line @typescript-eslint/naming-convention
      expect(result).toStrictEqual({ _name: 'Test', _id: undefined });
    });
  });
});
