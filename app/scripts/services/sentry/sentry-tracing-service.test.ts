import type * as Sentry from '@sentry/browser';
import { TraceName } from '../../../../shared/lib/trace';
import {
  SentryTracingService,
  type SentryTracingServiceMessenger,
} from './sentry-tracing-service';

jest.replaceProperty(global, 'sentry', {
  withIsolationScope: jest.fn(),
  startSpan: jest.fn(),
  startSpanManual: jest.fn(),
  setMeasurement: jest.fn(),
  getActiveSpan: jest.fn(),
  continueTrace: jest.fn(),
});

const { startSpanManual, withIsolationScope } = global.sentry as typeof Sentry;

const NAME_MOCK = TraceName.Transaction;
const ID_MOCK = 'testId';

describe('SentryTracingService', () => {
  const startSpanManualMock = jest.mocked(startSpanManual);
  // `withIsolationScope` is overloaded, so narrow the mock to the
  // single-callback overload that `trace` calls.
  const withIsolationScopeMock =
    withIsolationScope as unknown as jest.MockedFunction<
      (callback: (scope: Sentry.Scope) => unknown) => unknown
    >;
  const registerMethodActionHandlers = jest.fn();
  let optedIn: boolean;
  let service: SentryTracingService;

  beforeEach(() => {
    jest.resetAllMocks();
    optedIn = false;

    globalThis.sentry = {
      startSpan: jest.fn(),
      startSpanManual: startSpanManualMock,
      withIsolationScope,
      setMeasurement: jest.fn(),
      getActiveSpan: jest.fn(),
      continueTrace: jest.fn(),
    };

    startSpanManualMock.mockImplementation((_, fn) =>
      fn({} as Sentry.Span, () => undefined),
    );
    withIsolationScopeMock.mockImplementation((callback) =>
      callback({ setTag: jest.fn() } as unknown as Sentry.Scope),
    );

    service = new SentryTracingService({
      messenger: {
        call: () => ({ optedIn }),
        registerMethodActionHandlers,
      } as unknown as SentryTracingServiceMessenger,
    });
  });

  it('registers its messenger action handlers', () => {
    expect(registerMethodActionHandlers).toHaveBeenCalledWith(service, [
      'bufferedTrace',
      'bufferedEndTrace',
      'trackTracesAfterMetricsOptIn',
      'clearTracesAfterMetricsOptIn',
    ]);
  });

  it('reads live consent and starts a trace immediately when opted in', () => {
    optedIn = true;

    service.bufferedTrace({ name: NAME_MOCK });

    expect(startSpanManualMock).toHaveBeenCalledTimes(1);
  });

  it('buffers traces and flushes them in insertion order', () => {
    const events: string[] = [];
    const span = {
      end: jest.fn(() => events.push('end')),
    } as unknown as Sentry.Span;

    startSpanManualMock.mockImplementation((_, fn) => {
      events.push('start');
      return fn(span, () => undefined);
    });

    service.bufferedTrace({ name: NAME_MOCK, id: ID_MOCK });
    service.bufferedEndTrace({
      name: NAME_MOCK,
      id: ID_MOCK,
      timestamp: 123,
    });

    expect(startSpanManualMock).not.toHaveBeenCalled();

    service.trackTracesAfterMetricsOptIn();

    expect(events).toStrictEqual(['start', 'end']);
    expect(span.end).toHaveBeenCalledWith(123);
  });

  it('uses performance timestamps for buffered start and end defaults', () => {
    const performanceNowSpy = jest
      .spyOn(globalThis.performance, 'now')
      .mockReturnValue(500);
    const dateNowSpy = jest.spyOn(Date, 'now');
    const timestamp = globalThis.performance.timeOrigin + 500;
    const spanEndMock = jest.fn();
    const span = { end: spanEndMock } as unknown as Sentry.Span;

    startSpanManualMock.mockImplementationOnce((_, fn) =>
      fn(span, () => undefined),
    );

    service.bufferedTrace({ name: NAME_MOCK, id: ID_MOCK });
    service.bufferedEndTrace({ name: NAME_MOCK, id: ID_MOCK });

    expect(dateNowSpy).not.toHaveBeenCalled();

    service.trackTracesAfterMetricsOptIn();

    expect(startSpanManualMock).toHaveBeenCalledWith(
      expect.objectContaining({ startTime: timestamp }),
      expect.any(Function),
    );
    expect(spanEndMock).toHaveBeenCalledWith(timestamp);
    expect(performanceNowSpy).toHaveBeenCalledTimes(2);

    performanceNowSpy.mockRestore();
    dateNowSpy.mockRestore();
  });

  it('keeps buffered start and live end in the same clock domain', () => {
    const { timeOrigin } = globalThis.performance;
    const performanceNowSpy = jest
      .spyOn(globalThis.performance, 'now')
      .mockReturnValueOnce(100)
      .mockReturnValueOnce(200);
    const startTime = timeOrigin + 100;
    const endTime = timeOrigin + 200;
    const spanEndMock = jest.fn();
    const span = { end: spanEndMock } as unknown as Sentry.Span;

    startSpanManualMock.mockImplementationOnce((_, fn) =>
      fn(span, () => undefined),
    );

    service.bufferedTrace({ name: NAME_MOCK, id: 'buffered-live' });

    optedIn = true;
    service.trackTracesAfterMetricsOptIn();
    service.bufferedEndTrace({ name: NAME_MOCK, id: 'buffered-live' });

    expect(startSpanManualMock).toHaveBeenCalledWith(
      expect.objectContaining({ startTime }),
      expect.any(Function),
    );
    expect(spanEndMock).toHaveBeenCalledWith(endTime);
    expect(endTime).toBeGreaterThanOrEqual(startTime);

    performanceNowSpy.mockRestore();
  });

  it('keeps buffered start and end in the same clock domain during replay', () => {
    const { timeOrigin } = globalThis.performance;
    const performanceNowSpy = jest
      .spyOn(globalThis.performance, 'now')
      .mockReturnValueOnce(300)
      .mockReturnValueOnce(450);
    const startTime = timeOrigin + 300;
    const endTime = timeOrigin + 450;
    const spanEndMock = jest.fn();
    const span = { end: spanEndMock } as unknown as Sentry.Span;

    startSpanManualMock.mockImplementationOnce((_, fn) =>
      fn(span, () => undefined),
    );

    service.bufferedTrace({ name: NAME_MOCK, id: 'buffered-replay' });
    service.bufferedEndTrace({ name: NAME_MOCK, id: 'buffered-replay' });

    optedIn = true;
    service.trackTracesAfterMetricsOptIn();

    expect(startSpanManualMock).toHaveBeenCalledWith(
      expect.objectContaining({ startTime }),
      expect.any(Function),
    );
    expect(spanEndMock).toHaveBeenCalledWith(endTime);
    expect(endTime).toBeGreaterThanOrEqual(startTime);

    performanceNowSpy.mockRestore();
  });

  it('preserves serialized parent context while buffering', () => {
    const parentSpan = { end: jest.fn() } as unknown as Sentry.Span;
    const childSpan = { end: jest.fn() } as unknown as Sentry.Span;

    startSpanManualMock
      .mockImplementationOnce((_, fn) => fn(parentSpan, () => undefined))
      .mockImplementationOnce((_, fn) => fn(childSpan, () => undefined));

    service.bufferedTrace({ name: NAME_MOCK, id: 'parent' });
    service.bufferedTrace({
      name: TraceName.Middleware,
      id: 'child',
      parentContext: {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        _name: NAME_MOCK,
        // eslint-disable-next-line @typescript-eslint/naming-convention
        _id: 'parent',
      },
    });

    service.trackTracesAfterMetricsOptIn();

    expect(startSpanManualMock.mock.calls[1][0]).toEqual(
      expect.objectContaining({ parentSpan }),
    );
  });

  it('reconnects a buffered onboarding child to its journey on replay', () => {
    const journeyId = 'journey-id';
    const journeySpan = { end: jest.fn() } as unknown as Sentry.Span;
    const childSpan = { end: jest.fn() } as unknown as Sentry.Span;

    startSpanManualMock
      .mockImplementationOnce((_, fn) => fn(journeySpan, () => undefined))
      .mockImplementationOnce((_, fn) => fn(childSpan, () => undefined));

    service.bufferedTrace({
      name: TraceName.OnboardingJourneyOverall,
      id: journeyId,
    });
    service.bufferedTrace({
      name: TraceName.OnboardingPasswordSetupAttempt,
      parentContext: {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        _name: TraceName.OnboardingJourneyOverall,
        // eslint-disable-next-line @typescript-eslint/naming-convention
        _id: journeyId,
      },
    });

    service.trackTracesAfterMetricsOptIn();

    expect(startSpanManualMock.mock.calls[1][0]).toEqual(
      expect.objectContaining({ parentSpan: journeySpan }),
    );

    optedIn = true;
    service.bufferedEndTrace({
      name: TraceName.OnboardingPasswordSetupAttempt,
    });
    service.bufferedEndTrace({
      name: TraceName.OnboardingJourneyOverall,
      id: journeyId,
    });
    service.clearTracesAfterMetricsOptIn();
  });

  it('clears buffered traces without tracking them', () => {
    service.bufferedTrace({ name: NAME_MOCK });
    service.clearTracesAfterMetricsOptIn();

    service.trackTracesAfterMetricsOptIn();

    expect(startSpanManualMock).not.toHaveBeenCalled();
  });

  it('ends a trace immediately when metrics are opted in', () => {
    optedIn = true;
    const spanEndMock = jest.fn();
    const span = { end: spanEndMock } as unknown as Sentry.Span;
    startSpanManualMock.mockImplementationOnce((_, fn) =>
      fn(span, () => undefined),
    );

    service.bufferedTrace({ name: NAME_MOCK, id: ID_MOCK });
    service.bufferedEndTrace({ name: NAME_MOCK, id: ID_MOCK });

    expect(spanEndMock).toHaveBeenCalledTimes(1);
  });
});
