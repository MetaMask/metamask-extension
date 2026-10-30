import * as Sentry from '@sentry/browser';
import { SPAN_STATUS_ERROR, SPAN_STATUS_OK } from '@sentry/core';
import { it as jestIt } from '@jest/globals';
import {
  annotateTrace,
  endTrace,
  getSerializedTraceContext,
  getTraceContext,
  ONBOARDING_MACHINE_TIME_ATTRIBUTE,
  trace,
  TraceName,
} from './trace';

jest.replaceProperty(global, 'sentry', {
  withIsolationScope: jest.fn(),
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
      withScope: withScopeMock,
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
      expect(spanB && Sentry.spanToJSON(spanB).parent_span_id).toBeUndefined();
    });
  });

  describe('when a second, unrelated trace() call starts while the first is still pending', () => {
    // Bug confirmed via this harness; not yet fixed -- see
    // MetaMask-planning#7523. `it.failing` rather than `it.skip`: the test
    // runs, and passes *because* the assertion below fails today. When a fix
    // lands it starts passing, `it.failing` goes red, and whoever landed the
    // fix is told to flip this to `it`. A skipped test cannot do that -- it
    // detects neither the defect nor its repair.
    //
    // Scoped to parentage only. Trace-id sharing is a separate defect
    // (MetaMask-planning#7354, ambient baseline sharing that occurs with or
    // without overlap); asserting it here would keep this test failing after
    // a correct concurrency-only fix, so `it.failing` would keep passing and
    // the repair would go undetected. See the dedicated coverage below.
    jestIt.failing(
      'does not parent the second span under the still-pending first one',
      async () => {
        const aGate = deferred<void>();
        let spanA: Sentry.Span | null | undefined;

        // A's callback awaits an unresolved promise, so its isolation-scope
        // and current-scope layers stay on the SDK's shared
        // AsyncContextStack for as long as aGate is unresolved.
        const aPromise = trace(
          { name: NAME_MOCK, id: 'A-pending' },
          async () => {
            spanA = Sentry.getActiveSpan();
            await aGate.promise;
            return spanA;
          },
        );

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

          await bPromise;
        } finally {
          aGate.resolve();
          await aPromise;
        }
      },
    );

    // Same reasoning as above, and scoped to parentage for the same reason:
    // `spanC` resolves under B's already-corrupted lineage instead of being
    // independent. Passes today because the assertion fails; goes red when
    // the defect is fixed.
    jestIt.failing(
      'does not let a third concurrent call inherit an already-corrupted lineage',
      async () => {
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

          await cPromise;
        } finally {
          bGate.resolve();
          await bPromise;
          aGate.resolve();
          await aPromise;
        }
      },
    );
  });
});
