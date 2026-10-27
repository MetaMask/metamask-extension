import type * as Sentry from '@sentry/browser';
import { SPAN_STATUS_ERROR, SPAN_STATUS_OK } from '@sentry/core';
import {
  annotateTrace,
  continueTraceContext,
  endTrace,
  extractTraceContext,
  getSerializedTraceContext,
  getTraceContext,
  ONBOARDING_MACHINE_TIME_ATTRIBUTE,
  serializeTraceContext,
  trace,
  TraceName,
} from './trace';

// Canonical W3C traceparent fields (32-hex trace id, 16-hex span id, sampled).
const TRACE_ID_MOCK = '4bf92f3577b34da6a3ce929d0e0e4736';
const SPAN_ID_MOCK = '00f067aa0ba902b7';
const TRACEPARENT_MOCK = `00-${TRACE_ID_MOCK}-${SPAN_ID_MOCK}-01`;

jest.replaceProperty(global, 'sentry', {
  withIsolationScope: jest.fn(),
  startNewTrace: jest.fn(),
  withScope: jest.fn(),
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
  startNewTrace,
  withScope,
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
  const startNewTraceMock = jest.mocked(startNewTrace);
  const withScopeMock = jest.mocked(withScope);
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
      startNewTrace: startNewTraceMock,
      withScope: withScopeMock,
      setMeasurement: setMeasurementMock,
      getActiveSpan: getActiveSpanMock,
      continueTrace: continueTraceMock,
    };

    startSpanMock.mockImplementation((_, fn) => fn({} as Sentry.Span));

    // Pass-through: run the wrapped callback so root traces still create spans.
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31973
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    startNewTraceMock.mockImplementation((fn: any) => fn());

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

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    withScopeMock.mockImplementation((fn: any) => fn({ setTag: setTagMock }));
  });

  describe('trace', () => {
    it('defines the mobile-compatible onboarding machine-time trace names', () => {
      expect(TraceName.OnboardingSRPAccountCreationTime).toBe(
        'Onboarding SRP Account Creation Time',
      );
      expect(TraceName.OnboardingSRPAccountImportTime).toBe(
        'Onboarding SRP Account Import Time',
      );
    });

    it('executes callback', () => {
      let callbackExecuted = false;

      trace({ name: NAME_MOCK }, () => {
        callbackExecuted = true;
      });

      expect(callbackExecuted).toBe(true);
    });

    it('retrieves and annotates a pending trace context', () => {
      const setAttributeMock = jest.fn();
      const spanMock = {
        end: jest.fn(),
        setAttribute: setAttributeMock,
        spanContext: jest.fn(),
      } as unknown as Sentry.Span;

      startSpanManualMock.mockImplementationOnce((_, fn) =>
        fn(spanMock, () => {
          // Intentionally empty
        }),
      );

      trace({ name: NAME_MOCK, id: ID_MOCK });

      const context = getTraceContext({ name: NAME_MOCK, id: ID_MOCK });
      annotateTrace(context, {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        account_type: 'metamask',
      });

      expect(setAttributeMock).toHaveBeenCalledWith('account_type', 'metamask');

      endTrace({ name: NAME_MOCK, id: ID_MOCK });
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

      expect(withScopeMock).toHaveBeenCalledTimes(1);

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

      expect(withScopeMock).toHaveBeenCalledTimes(1);

      expect(startSpanManualMock).toHaveBeenCalledTimes(1);
      expect(startSpanManualMock).toHaveBeenCalledWith(
        expect.objectContaining({
          name: NAME_MOCK,
          parentSpan: PARENT_CONTEXT_MOCK,
          attributes: DATA_MOCK,
          op: 'custom',
        }),
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

      expect(withScopeMock).toHaveBeenCalledTimes(1);

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

    it('uses the performance timestamp for a default manual start time', () => {
      const performanceNowSpy = jest
        .spyOn(globalThis.performance, 'now')
        .mockReturnValue(500);
      const startTime = globalThis.performance.timeOrigin + 500;
      const id = 'default-start-time';
      const spanMock = {
        end: jest.fn(),
      } as unknown as Sentry.Span;

      startSpanManualMock.mockImplementationOnce((_, fn) =>
        fn(spanMock, () => {
          // Intentionally empty
        }),
      );

      trace({ name: NAME_MOCK, id });

      expect(startSpanManualMock).toHaveBeenCalledWith(
        expect.objectContaining({ startTime }),
        expect.any(Function),
      );

      endTrace({ name: NAME_MOCK, id, timestamp: startTime });
      performanceNowSpy.mockRestore();
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

    for (const [status, code] of [
      ['ok', SPAN_STATUS_OK],
      ['error', SPAN_STATUS_ERROR],
    ] as const) {
      it(`sets the Sentry span status to ${status} before ending it`, () => {
        const spanEndMock = jest.fn();
        const setStatusMock = jest.fn();
        const spanMock = {
          end: spanEndMock,
          setStatus: setStatusMock,
        } as unknown as Sentry.Span;

        startSpanManualMock.mockImplementationOnce((_, fn) =>
          fn(spanMock, () => {
            // Intentionally empty
          }),
        );

        trace({ name: NAME_MOCK, id: ID_MOCK });
        endTrace({ name: NAME_MOCK, id: ID_MOCK, status });

        expect(setStatusMock).toHaveBeenCalledWith({ code });
        expect(setStatusMock.mock.invocationCallOrder[0]).toBeLessThan(
          spanEndMock.mock.invocationCallOrder[0],
        );
      });
    }

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

    it('uses the performance timestamp for a default manual end time', () => {
      const performanceNowSpy = jest
        .spyOn(globalThis.performance, 'now')
        .mockReturnValueOnce(100)
        .mockReturnValueOnce(200);
      const { timeOrigin } = globalThis.performance;
      const startTime = timeOrigin + 100;
      const endTime = timeOrigin + 200;
      const spanEndMock = jest.fn();
      const spanMock = { end: spanEndMock } as unknown as Sentry.Span;
      const id = 'default-end-time';

      startSpanManualMock.mockImplementationOnce((_, fn) =>
        fn(spanMock, () => {
          // Intentionally empty
        }),
      );

      trace({ name: NAME_MOCK, id });
      endTrace({ name: NAME_MOCK, id });

      expect(spanEndMock).toHaveBeenCalledWith(endTime);
      expect(endTime).toBeGreaterThanOrEqual(startTime);
      expect(performanceNowSpy).toHaveBeenCalledTimes(2);

      performanceNowSpy.mockRestore();
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

  describe('active-span fallback (opt-in via allowActiveSpanFallback)', () => {
    it('does not inherit from the active span when the flag is absent', () => {
      const activeSpanMock = {
        spanContext: jest.fn().mockReturnValue({
          traceId: 'abc123',
          spanId: 'def456',
        }),
      } as unknown as Sentry.Span;

      getActiveSpanMock.mockReturnValue(activeSpanMock);

      trace({ name: NAME_MOCK }, () => true);

      // The span must start as a root, not grafted onto the ambient span, and
      // the ambient span must not even be looked up.
      expect(startSpanMock).toHaveBeenCalledWith(
        expect.objectContaining({
          parentSpan: null,
        }),
        expect.any(Function),
      );
      expect(startSpanMock).not.toHaveBeenCalledWith(
        expect.objectContaining({
          parentSpan: activeSpanMock,
        }),
        expect.any(Function),
      );
      expect(getActiveSpanMock).not.toHaveBeenCalled();

      const [spanOptions] = startSpanMock.mock.calls[0];
      expect(spanOptions).not.toHaveProperty('forceTransaction');
    });

    it('inherits the active span and forces a transaction only when the flag is set', () => {
      const activeSpanMock = {
        spanContext: jest.fn(),
      } as unknown as Sentry.Span;

      getActiveSpanMock.mockReturnValue(activeSpanMock);

      trace({ name: NAME_MOCK, allowActiveSpanFallback: true }, () => true);
      trace({ name: NAME_MOCK, id: ID_MOCK }, () => true);

      // Asserted as a pair: the flag, and nothing else, is what separates the
      // inheriting call from the rooting one.
      const [optedIn] = startSpanMock.mock.calls[0];
      const [optedOut] = startSpanMock.mock.calls[1];

      expect(optedIn).toStrictEqual(
        expect.objectContaining({
          parentSpan: activeSpanMock,
          forceTransaction: true,
        }),
      );
      expect(optedOut).toStrictEqual(
        expect.objectContaining({
          parentSpan: null,
        }),
      );
      expect(optedOut).not.toHaveProperty('forceTransaction');
    });

    it('lets an explicit parentContext win over the flag, without consulting getActiveSpan', () => {
      const activeSpanMock = {
        spanContext: jest.fn(),
      } as unknown as Sentry.Span;

      getActiveSpanMock.mockReturnValue(activeSpanMock);

      trace(
        {
          name: NAME_MOCK,
          parentContext: PARENT_CONTEXT_MOCK,
          allowActiveSpanFallback: true,
        },
        () => true,
      );

      expect(startSpanMock).toHaveBeenCalledWith(
        expect.objectContaining({
          parentSpan: PARENT_CONTEXT_MOCK,
        }),
        expect.any(Function),
      );
      expect(getActiveSpanMock).not.toHaveBeenCalled();

      const [spanOptions] = startSpanMock.mock.calls[0];
      expect(spanOptions).not.toHaveProperty('forceTransaction');
    });

    it('roots the span when the flag is set but no active span exists', () => {
      getActiveSpanMock.mockReturnValue(undefined);

      expect(() => {
        trace({ name: NAME_MOCK, allowActiveSpanFallback: true }, () => true);
      }).not.toThrow();

      expect(startSpanMock).toHaveBeenCalledWith(
        expect.objectContaining({
          parentSpan: null,
        }),
        expect.any(Function),
      );

      const [spanOptions] = startSpanMock.mock.calls[0];
      expect(spanOptions).not.toHaveProperty('forceTransaction');
    });

    it('still honours an explicitly provided parentContext', () => {
      trace(
        { name: NAME_MOCK, parentContext: PARENT_CONTEXT_MOCK },
        () => true,
      );

      expect(startSpanMock).toHaveBeenCalledWith(
        expect.objectContaining({
          parentSpan: PARENT_CONTEXT_MOCK,
        }),
        expect.any(Function),
      );
    });
  });

  describe('forceTransaction', () => {
    it('is absent when an active span exists but the flag is not set', () => {
      const activeSpanMock = {
        spanContext: jest.fn(),
      } as unknown as Sentry.Span;

      getActiveSpanMock.mockReturnValue(activeSpanMock);

      trace({ name: NAME_MOCK }, () => true);

      const [spanOptions] = startSpanMock.mock.calls[0];
      expect(spanOptions).not.toHaveProperty('forceTransaction');
    });

    it('is absent when a parentContext is provided', () => {
      trace(
        { name: NAME_MOCK, parentContext: PARENT_CONTEXT_MOCK },
        () => true,
      );

      const [spanOptions] = startSpanMock.mock.calls[0];
      expect(spanOptions).not.toHaveProperty('forceTransaction');
    });

    it('is absent on the manually-ended (startSpanManual) path when the flag is not set', () => {
      const activeSpanMock = {
        spanContext: jest.fn(),
      } as unknown as Sentry.Span;

      getActiveSpanMock.mockReturnValue(activeSpanMock);

      trace({ name: NAME_MOCK, id: ID_MOCK });

      const [spanOptions] = startSpanManualMock.mock.calls[0];
      expect(spanOptions).not.toHaveProperty('forceTransaction');
      expect(spanOptions).toStrictEqual(
        expect.objectContaining({ parentSpan: null }),
      );
    });

    it('is true on the manually-ended (startSpanManual) path when the flag is set', () => {
      const activeSpanMock = {
        spanContext: jest.fn(),
      } as unknown as Sentry.Span;

      getActiveSpanMock.mockReturnValue(activeSpanMock);

      trace({ name: NAME_MOCK, id: ID_MOCK, allowActiveSpanFallback: true });

      const [spanOptions] = startSpanManualMock.mock.calls[0];
      expect(spanOptions).toStrictEqual(
        expect.objectContaining({
          parentSpan: activeSpanMock,
          forceTransaction: true,
        }),
      );
    });

    it('does not inherit from the active span when root is true, even with allowActiveSpanFallback', () => {
      const activeSpanMock = {
        spanContext: jest.fn().mockReturnValue({
          traceId: 'abc123',
          spanId: 'def456',
        }),
      } as unknown as Sentry.Span;

      getActiveSpanMock.mockReturnValue(activeSpanMock);

      trace(
        { name: NAME_MOCK, root: true, allowActiveSpanFallback: true },
        () => true,
      );

      expect(getActiveSpanMock).not.toHaveBeenCalled();
      const [spanOptions] = startSpanMock.mock.calls[0];
      expect(spanOptions).toStrictEqual(
        expect.objectContaining({ parentSpan: null }),
      );
      expect(spanOptions).not.toHaveProperty('forceTransaction');
    });

    it('starts a new trace (fresh propagation context) when root is true', () => {
      trace({ name: NAME_MOCK, root: true }, () => true);

      // startNewTrace resets the propagation-context trace id, so the op roots
      // its own trace instead of inheriting the ambient (e.g. SW pageload) one.
      // withScope alone would clone the same trace id — severing the parent
      // span but leaving the op in the mega-trace (grouped by trace id).
      expect(startNewTraceMock).toHaveBeenCalledTimes(1);
      expect(startNewTraceMock).toHaveBeenCalledWith(expect.any(Function));
      expect(withScopeMock).toHaveBeenCalledTimes(1);
    });

    it('does not start a new trace when root is not set', () => {
      trace({ name: NAME_MOCK }, () => true);

      expect(startNewTraceMock).not.toHaveBeenCalled();
      expect(withScopeMock).toHaveBeenCalledTimes(1);
    });
  });

  describe('cross-process trace context (continueTrace)', () => {
    it('uses continueTrace when parentContext has traceId and parentSpanId', () => {
      continueTraceMock.mockImplementation((_opts, fn) => fn());

      trace(
        {
          name: NAME_MOCK,
          parentContext: {
            traceId: TRACE_ID_MOCK,
            parentSpanId: SPAN_ID_MOCK,
            parentSampled: true,
          },
        },
        () => true,
      );

      expect(continueTraceMock).toHaveBeenCalledTimes(1);
      expect(continueTraceMock).toHaveBeenCalledWith(
        {
          sentryTrace: `${TRACE_ID_MOCK}-${SPAN_ID_MOCK}-1`,
          baggage: `sentry-trace_id=${TRACE_ID_MOCK},sentry-sampled=true`,
        },
        expect.any(Function),
      );
    });

    it('passes parentSpan as undefined inside continueTrace callback', () => {
      continueTraceMock.mockImplementation((_opts, fn) => fn());

      trace(
        {
          name: NAME_MOCK,
          parentContext: {
            traceId: TRACE_ID_MOCK,
            parentSpanId: SPAN_ID_MOCK,
          },
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

    it('parses a `traceparent` string when the same-process map lookup misses', () => {
      // A snap returns a SerializedTraceContext { _name, _id, traceparent } whose
      // pending parent was already removed (e.g. after snap_endTrace), so the map
      // lookup misses. The traceparent string must still root the child on the
      // originating trace via continueTrace rather than orphaning it.
      continueTraceMock.mockImplementation((_opts, fn) => fn());

      trace(
        {
          name: TraceName.Middleware,
          parentContext: {
            // eslint-disable-next-line @typescript-eslint/naming-convention
            _name: TraceName.Transaction,
            // eslint-disable-next-line @typescript-eslint/naming-convention
            _id: 'ended-parent',
            traceparent: TRACEPARENT_MOCK,
          },
        },
        () => true,
      );

      expect(continueTraceMock).toHaveBeenCalledTimes(1);
      expect(continueTraceMock).toHaveBeenCalledWith(
        {
          sentryTrace: `${TRACE_ID_MOCK}-${SPAN_ID_MOCK}-1`,
          baggage: `sentry-trace_id=${TRACE_ID_MOCK},sentry-sampled=true`,
        },
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

      // Use serialized context with _name (for map lookup) alongside parsed
      // distributed trace ids — map lookup should win.
      trace(
        {
          name: TraceName.Middleware,
          parentContext: {
            // eslint-disable-next-line @typescript-eslint/naming-convention
            _name: TraceName.Transaction,
            // eslint-disable-next-line @typescript-eslint/naming-convention
            _id: 'parent-id',
            traceId: TRACE_ID_MOCK,
            parentSpanId: SPAN_ID_MOCK,
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

    // Regression test for MetaMask-planning#7569.
    //
    // The case above covers a map-lookup HIT. This covers the MISS: an
    // in-process parent whose span is not in `tracesByKey` (it ended, or was
    // never registered). `resolveParentSpan` returns `null` for that, which is
    // the same value it returns for "no parent intended" — so `startSpan`
    // cannot tell the two apart, sees the serialized ids, and routes to
    // `continueTrace` with `parentSpan: undefined`. That promotes the span to a
    // segment, and a segment is a billed transaction.
    //
    // Measured consequence: ~44.6% of extension transactions carry a
    // `parent_span` id while being billed as roots, across 25 families.
    //
    it('does not promote an unresolvable in-process parent to a segment', () => {
      continueTraceMock.mockImplementation((_opts, fn) => fn());
      const activeSpanMock = {
        spanContext: jest.fn(),
      } as unknown as Sentry.Span;
      getActiveSpanMock.mockReturnValue(activeSpanMock);

      // No pending trace is created, so the map lookup misses.
      trace(
        {
          name: TraceName.Middleware,
          parentContext: {
            // eslint-disable-next-line @typescript-eslint/naming-convention
            _name: TraceName.Transaction,
            // eslint-disable-next-line @typescript-eslint/naming-convention
            _id: 'absent-from-map',
            // eslint-disable-next-line @typescript-eslint/naming-convention
            _traceId: 'trace123',
            // eslint-disable-next-line @typescript-eslint/naming-convention
            _spanId: 'span456',
          },
        },
        () => true,
      );

      // A parent was named. Failing to resolve it locally must not silently
      // convert the span into a billed root.
      expect(continueTraceMock).not.toHaveBeenCalled();
      const [spanOptions] = startSpanMock.mock.calls[0];
      expect(spanOptions.parentSpan).toBe(activeSpanMock);
      expect(spanOptions.forceTransaction).toBeUndefined();
    });

    // `undefined` and `null` are different statements; only the first may be
    // promoted to a transaction. See MetaMask/MetaMask-planning#7569.
    it('does not promote a null parentContext to a segment', () => {
      const activeSpanMock = {
        spanContext: jest.fn(),
      } as unknown as Sentry.Span;
      getActiveSpanMock.mockReturnValue(activeSpanMock);

      trace({ name: NAME_MOCK, parentContext: null }, () => true);

      const [spanOptions] = startSpanMock.mock.calls[0];
      expect(spanOptions.parentSpan).toBe(activeSpanMock);
      expect(spanOptions).not.toHaveProperty('forceTransaction');
    });
  });

  describe('onboarding machine time', () => {
    const createSpanMock = () => {
      const setAttributeMock = jest.fn();
      const endMock = jest.fn();
      const spanMock = {
        end: endMock,
        setAttribute: setAttributeMock,
        spanContext: jest.fn(),
      } as unknown as Sentry.Span;

      return { endMock, setAttributeMock, spanMock };
    };

    const queueSpans = (spans: ReturnType<typeof createSpanMock>[]) => {
      spans.forEach(({ spanMock }) => {
        startSpanManualMock.mockImplementationOnce((_, fn) =>
          fn(spanMock, () => {
            // Intentionally empty
          }),
        );
      });
    };

    const expectMachineTime = (
      journey: ReturnType<typeof createSpanMock>,
      expected: number,
    ) => {
      expect(journey.setAttributeMock).toHaveBeenCalledWith(
        ONBOARDING_MACHINE_TIME_ATTRIBUTE,
        expected,
      );
    };

    it('sums successful machine spans before ending the journey', () => {
      expect.assertions(2);
      const journey = createSpanMock();
      queueSpans([
        journey,
        createSpanMock(),
        createSpanMock(),
        createSpanMock(),
        createSpanMock(),
      ]);

      trace({ name: TraceName.OnboardingJourneyOverall, startTime: 0 });
      trace({
        name: TraceName.OnboardingFetchSrps,
        startTime: 1_000,
      });
      endTrace({
        name: TraceName.OnboardingFetchSrps,
        timestamp: 1_500,
        data: { success: true },
      });
      trace({
        name: TraceName.OnboardingSRPAccountImportTime,
        startTime: 2_000,
      });
      endTrace({
        name: TraceName.OnboardingSRPAccountImportTime,
        timestamp: 3_200,
        data: { success: true },
      });
      endTrace({ name: TraceName.OnboardingJourneyOverall, timestamp: 4_000 });

      expectMachineTime(journey, 1_700);
      expect(journey.setAttributeMock.mock.invocationCallOrder[0]).toBeLessThan(
        journey.endMock.mock.invocationCallOrder[0],
      );
    });

    it('excludes failed and human-interaction spans', () => {
      expect.assertions(1);
      const journey = createSpanMock();
      queueSpans([
        journey,
        createSpanMock(),
        createSpanMock(),
        createSpanMock(),
      ]);

      trace({ name: TraceName.OnboardingJourneyOverall, startTime: 0 });
      trace({
        name: TraceName.OnboardingOAuthSeedlessAuthenticate,
        startTime: 1_000,
      });
      endTrace({
        name: TraceName.OnboardingOAuthSeedlessAuthenticate,
        timestamp: 2_000,
        data: { success: false },
      });
      trace({
        name: TraceName.OnboardingPasswordSetupAttempt,
        startTime: 2_000,
      });
      endTrace({
        name: TraceName.OnboardingPasswordSetupAttempt,
        timestamp: 30_000,
      });
      trace({
        name: TraceName.OnboardingOAuthProviderLogin,
        startTime: 30_000,
      });
      endTrace({
        name: TraceName.OnboardingOAuthProviderLogin,
        timestamp: 40_000,
        data: { success: true },
      });
      endTrace({ name: TraceName.OnboardingJourneyOverall, timestamp: 50_000 });

      expectMachineTime(journey, 0);
    });

    it('includes OAuth launch time but excludes provider wait', () => {
      expect.assertions(1);
      const journey = createSpanMock();
      queueSpans([
        journey,
        createSpanMock(),
        createSpanMock(),
        createSpanMock(),
      ]);

      trace({ name: TraceName.OnboardingJourneyOverall, startTime: 0 });
      trace({
        name: TraceName.OnboardingOAuthProviderLaunch,
        startTime: 1_000,
      });
      endTrace({
        name: TraceName.OnboardingOAuthProviderLaunch,
        timestamp: 2_500,
        data: { success: true },
      });
      trace({
        name: TraceName.OnboardingOAuthProviderInteraction,
        startTime: 2_500,
      });
      endTrace({
        name: TraceName.OnboardingOAuthProviderInteraction,
        timestamp: 40_000,
        data: { success: true },
      });
      trace({
        name: TraceName.OnboardingOAuthProviderLogin,
        startTime: 40_000,
      });
      endTrace({
        name: TraceName.OnboardingOAuthProviderLogin,
        timestamp: 80_000,
        data: { success: true },
      });
      endTrace({ name: TraceName.OnboardingJourneyOverall, timestamp: 90_000 });

      expectMachineTime(journey, 1_500);
    });

    it('counts open machine spans at successful journey end', () => {
      expect.assertions(1);
      const journey = createSpanMock();
      queueSpans([journey, createSpanMock()]);

      trace({ name: TraceName.OnboardingJourneyOverall, startTime: 0 });
      trace({
        name: TraceName.OnboardingSRPAccountCreationTime,
        startTime: 1_000,
      });
      endTrace({ name: TraceName.OnboardingJourneyOverall, timestamp: 3_000 });

      expectMachineTime(journey, 2_000);
    });

    it('does not double-count nested backup work', () => {
      expect.assertions(1);
      const journey = createSpanMock();
      queueSpans([journey, createSpanMock(), createSpanMock()]);

      trace({ name: TraceName.OnboardingJourneyOverall, startTime: 0 });
      trace({
        name: TraceName.OnboardingSRPAccountCreationTime,
        startTime: 1_000,
      });
      trace({
        name: TraceName.OnboardingCreateKeyAndBackupSrp,
        startTime: 1_200,
      });
      endTrace({
        name: TraceName.OnboardingCreateKeyAndBackupSrp,
        timestamp: 1_800,
        data: { success: true },
      });
      endTrace({
        name: TraceName.OnboardingSRPAccountCreationTime,
        timestamp: 2_500,
      });
      endTrace({ name: TraceName.OnboardingJourneyOverall, timestamp: 3_000 });

      expectMachineTime(journey, 1_500);
    });

    it('keeps only the latest successful duration for retried spans', () => {
      expect.assertions(1);
      const journey = createSpanMock();
      queueSpans([journey, createSpanMock(), createSpanMock()]);

      trace({ name: TraceName.OnboardingJourneyOverall, startTime: 0 });
      trace({
        name: TraceName.OnboardingOAuthBYOAServerGetAuthTokens,
        startTime: 1_000,
      });
      endTrace({
        name: TraceName.OnboardingOAuthBYOAServerGetAuthTokens,
        timestamp: 1_500,
      });
      trace({
        name: TraceName.OnboardingOAuthBYOAServerGetAuthTokens,
        startTime: 2_000,
      });
      endTrace({
        name: TraceName.OnboardingOAuthBYOAServerGetAuthTokens,
        timestamp: 2_700,
      });
      endTrace({ name: TraceName.OnboardingJourneyOverall, timestamp: 3_000 });

      expectMachineTime(journey, 700);
    });

    it('rounds the aggregate to whole milliseconds and resets per journey', () => {
      expect.assertions(2);
      const firstJourney = createSpanMock();
      const secondJourney = createSpanMock();
      queueSpans([
        firstJourney,
        createSpanMock(),
        secondJourney,
        createSpanMock(),
      ]);

      trace({ name: TraceName.OnboardingJourneyOverall, startTime: 0 });
      trace({
        name: TraceName.OnboardingSRPAccountCreationTime,
        startTime: 1_000.25,
      });
      endTrace({
        name: TraceName.OnboardingSRPAccountCreationTime,
        timestamp: 1_900.9,
      });
      endTrace({ name: TraceName.OnboardingJourneyOverall, timestamp: 2_000 });

      trace({ name: TraceName.OnboardingJourneyOverall, startTime: 10_000 });
      trace({
        name: TraceName.OnboardingSRPAccountImportTime,
        startTime: 10_000,
      });
      endTrace({
        name: TraceName.OnboardingSRPAccountImportTime,
        timestamp: 10_100,
      });
      endTrace({ name: TraceName.OnboardingJourneyOverall, timestamp: 11_000 });

      expectMachineTime(firstJourney, 901);
      expectMachineTime(secondJourney, 100);
    });
  });

  describe('getSerializedTraceContext', () => {
    it('returns undefined when no active span', () => {
      getActiveSpanMock.mockReturnValue(undefined);
      expect(getSerializedTraceContext()).toBeUndefined();
    });

    it('returns a W3C traceparent string from the active span', () => {
      const activeSpanMock = {
        spanContext: jest.fn().mockReturnValue({
          traceId: TRACE_ID_MOCK,
          spanId: SPAN_ID_MOCK,
          traceFlags: 1,
        }),
      } as unknown as Sentry.Span;

      getActiveSpanMock.mockReturnValue(activeSpanMock);

      expect(getSerializedTraceContext()).toBe(TRACEPARENT_MOCK);
    });

    it('encodes an unsampled active span with `00` flags', () => {
      const activeSpanMock = {
        spanContext: jest.fn().mockReturnValue({
          traceId: TRACE_ID_MOCK,
          spanId: SPAN_ID_MOCK,
          traceFlags: 0,
        }),
      } as unknown as Sentry.Span;

      getActiveSpanMock.mockReturnValue(activeSpanMock);

      expect(getSerializedTraceContext()).toBe(
        `00-${TRACE_ID_MOCK}-${SPAN_ID_MOCK}-00`,
      );
    });

    it('returns undefined when sentry is not initialized', () => {
      globalThis.sentry = undefined;
      expect(getSerializedTraceContext()).toBeUndefined();
    });
  });

  describe('extractTraceContext', () => {
    it('strips a valid W3C traceparent last-param and returns parsed context', () => {
      const result = extractTraceContext([
        'arg1',
        'arg2',
        // eslint-disable-next-line @typescript-eslint/naming-convention
        { _traceContext: TRACEPARENT_MOCK },
      ]);

      expect(result.cleanParams).toStrictEqual(['arg1', 'arg2']);
      expect(result.traceContext).toStrictEqual({
        traceId: TRACE_ID_MOCK,
        parentSpanId: SPAN_ID_MOCK,
        parentSampled: true,
      });
    });

    it('preserves params when the last param is not a trace envelope', () => {
      const params = ['arg1', { foo: 'bar' }];
      const result = extractTraceContext(params);

      expect(result.cleanParams).toBe(params);
      expect(result.traceContext).toBeUndefined();
    });

    it('does not strip a `_traceContext` that is not a valid traceparent', () => {
      const params = [
        'arg1',
        // eslint-disable-next-line @typescript-eslint/naming-convention
        { _traceContext: 'not-a-traceparent' },
      ];
      const result = extractTraceContext(params);

      expect(result.cleanParams).toBe(params);
      expect(result.traceContext).toBeUndefined();
    });

    it('returns the params unchanged when not an array', () => {
      const result = extractTraceContext(undefined);
      expect(result.cleanParams).toBeUndefined();
      expect(result.traceContext).toBeUndefined();
    });

    it('round-trips with getSerializedTraceContext', () => {
      const activeSpanMock = {
        spanContext: jest.fn().mockReturnValue({
          traceId: TRACE_ID_MOCK,
          spanId: SPAN_ID_MOCK,
          traceFlags: 1,
        }),
      } as unknown as Sentry.Span;
      getActiveSpanMock.mockReturnValue(activeSpanMock);

      const traceparent = getSerializedTraceContext();
      const { traceContext } = extractTraceContext([
        'arg',
        // eslint-disable-next-line @typescript-eslint/naming-convention
        { _traceContext: traceparent },
      ]);

      expect(traceContext?.traceId).toBe(TRACE_ID_MOCK);
      expect(traceContext?.parentSpanId).toBe(SPAN_ID_MOCK);
    });
  });

  describe('continueTraceContext', () => {
    it('resumes the parent context via continueTrace', () => {
      continueTraceMock.mockImplementation((_opts, fn) => fn());
      const callback = jest.fn().mockReturnValue('result');

      const result = continueTraceContext(
        {
          traceId: TRACE_ID_MOCK,
          parentSpanId: SPAN_ID_MOCK,
          parentSampled: true,
        },
        callback,
      );

      expect(result).toBe('result');
      expect(continueTraceMock).toHaveBeenCalledWith(
        {
          sentryTrace: `${TRACE_ID_MOCK}-${SPAN_ID_MOCK}-1`,
          baggage: `sentry-trace_id=${TRACE_ID_MOCK},sentry-sampled=true`,
        },
        expect.any(Function),
      );
      expect(callback).toHaveBeenCalledTimes(1);
    });

    it('marks the continued baggage unsampled when the parent is unsampled', () => {
      continueTraceMock.mockImplementation((_opts, fn) => fn());

      continueTraceContext(
        {
          traceId: TRACE_ID_MOCK,
          parentSpanId: SPAN_ID_MOCK,
          parentSampled: false,
        },
        jest.fn(),
      );

      expect(continueTraceMock).toHaveBeenCalledWith(
        expect.objectContaining({
          baggage: `sentry-trace_id=${TRACE_ID_MOCK},sentry-sampled=false`,
        }),
        expect.any(Function),
      );
    });

    it('runs the callback directly when no trace context is provided', () => {
      const callback = jest.fn().mockReturnValue('result');

      const result = continueTraceContext(undefined, callback);

      expect(result).toBe('result');
      expect(continueTraceMock).not.toHaveBeenCalled();
      expect(callback).toHaveBeenCalledTimes(1);
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

    it('includes a W3C traceparent from span', () => {
      const spanMock = {
        spanContext: jest.fn().mockReturnValue({
          traceId: TRACE_ID_MOCK,
          spanId: SPAN_ID_MOCK,
          traceFlags: 1,
        }),
      } as unknown as Sentry.Span;

      const result = serializeTraceContext(spanMock, { name: 'Test' });
      expect(result).toStrictEqual({
        // eslint-disable-next-line @typescript-eslint/naming-convention
        _name: 'Test',
        traceparent: TRACEPARENT_MOCK,
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
      expect(result).toStrictEqual({ _name: 'Test' });
    });
  });
});
