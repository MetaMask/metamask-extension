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
