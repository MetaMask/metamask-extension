import { it as jestIt } from '@jest/globals';
import type * as Sentry from '@sentry/browser';
import { TraceName, TraceOperation } from '../../../shared/lib/trace';
import type * as Timing from '../../../shared/lib/ui-startup-timing';
import type * as Readiness from './useful-screen-ready';

let mockReadiness: typeof Readiness;

describe('registerDocumentLoadMeasurement', () => {
  const setTag = jest.fn();
  const end = jest.fn();
  const startSpanManual = jest.fn();
  let timing: typeof Timing;
  let getEntriesByTypeDescriptor: PropertyDescriptor | undefined;

  const register = () =>
    mockReadiness.registerDocumentLoadMeasurement({
      screen: 'example',
      tags: { 'example.initial_state': true },
    });

  beforeEach(() => {
    jest.useFakeTimers({ now: 0, doNotFake: ['performance'] });
    jest.spyOn(performance, 'now').mockImplementation(() => Date.now());
    jest.clearAllMocks();
    jest.spyOn(document, 'visibilityState', 'get').mockReturnValue('visible');
    // JSDOM does not implement the performance timeline.
    getEntriesByTypeDescriptor = Object.getOwnPropertyDescriptor(
      performance,
      'getEntriesByType',
    );
    Object.defineProperty(performance, 'getEntriesByType', {
      configurable: true,
      writable: true,
      value: jest.fn().mockReturnValue([]),
    });
    startSpanManual.mockImplementation((_, callback) =>
      callback({ end, setAttribute: jest.fn() } as unknown as Sentry.Span),
    );
    jest.replaceProperty(global, 'sentry', {
      startSpanManual,
      withIsolationScope: (callback: (scope: Sentry.Scope) => unknown) =>
        callback({ setTag } as unknown as Sentry.Scope),
    });
    jest.isolateModules(() => {
      mockReadiness = jest.requireActual('./useful-screen-ready');
      timing = jest.requireActual('../../../shared/lib/ui-startup-timing');
    });
  });

  afterEach(() => {
    window.dispatchEvent(new Event('pagehide'));
    if (getEntriesByTypeDescriptor) {
      Object.defineProperty(
        performance,
        'getEntriesByType',
        getEntriesByTypeDescriptor,
      );
    } else {
      Reflect.deleteProperty(performance, 'getEntriesByType');
    }
    jest.useRealTimers();
  });

  it('records document loading until the page explicitly reports readiness', () => {
    mockReadiness.trackUsefulScreenVisibility();
    jest.advanceTimersByTime(400);
    const tags = { 'example.initial_state': true };
    const measurement = mockReadiness.registerDocumentLoadMeasurement({
      screen: 'example',
      tags,
    });
    tags['example.initial_state'] = false;
    jest.advanceTimersByTime(32);
    expect(startSpanManual).not.toHaveBeenCalled();

    measurement.reportReady();

    expect(startSpanManual).toHaveBeenCalledWith(
      expect.objectContaining({
        name: TraceName.UsefulScreenReady,
        op: TraceOperation.UiScreenPerformance,
        startTime: performance.timeOrigin,
        attributes: { success: true },
      }),
      expect.any(Function),
    );
    expect(end).toHaveBeenCalledWith(
      performance.timeOrigin + performance.now(),
    );
    expect(setTag).toHaveBeenCalledWith('screen', 'example');
    expect(setTag).toHaveBeenCalledWith('example.initial_state', true);
  });

  jestIt.each(['reportReady', 'discard'] as const)(
    'permanently ends document sampling after %s',
    (finish) => {
      mockReadiness.trackUsefulScreenVisibility();
      const measurement = register();

      measurement[finish]();
      measurement.reportReady();
      measurement.discard();
      register().reportReady();

      expect(startSpanManual).toHaveBeenCalledTimes(
        finish === 'reportReady' ? 1 : 0,
      );
    },
  );

  jestIt.each([
    { states: ['hidden', 'visible'] },
    { states: ['visible', 'hidden', 'visible'] },
  ])('excludes earlier hidden visibility history $states', ({ states }) => {
    jest
      .spyOn(performance, 'getEntriesByType')
      .mockImplementation((type) =>
        type === 'visibility-state'
          ? states.map((name) => ({ name }) as PerformanceEntry)
          : [],
      );

    mockReadiness.trackUsefulScreenVisibility();
    const measurement = register();
    measurement.reportReady();

    expect(startSpanManual).not.toHaveBeenCalled();
  });

  jestIt.each(['hidden', 'closed'] as const)(
    'excludes a document %s before background state arrives without visibility history',
    (reason) => {
      mockReadiness.trackUsefulScreenVisibility();
      if (reason === 'hidden') {
        jest
          .spyOn(document, 'visibilityState', 'get')
          .mockReturnValue('hidden');
        document.dispatchEvent(new Event('visibilitychange'));
        jest
          .spyOn(document, 'visibilityState', 'get')
          .mockReturnValue('visible');
      } else {
        window.dispatchEvent(new Event('pagehide'));
      }

      const measurement = register();
      measurement.reportReady();

      expect(startSpanManual).not.toHaveBeenCalled();
    },
  );

  it('accepts an entirely visible document history', () => {
    jest
      .spyOn(performance, 'getEntriesByType')
      .mockReturnValue([{ name: 'visible' } as PerformanceEntry]);

    mockReadiness.trackUsefulScreenVisibility();
    const measurement = register();
    measurement.reportReady();

    expect(startSpanManual).toHaveBeenCalledTimes(1);
  });

  jestIt.each(['initially hidden', 'hidden during load', 'closed'] as const)(
    'excludes a document that is %s',
    (reason) => {
      if (reason === 'initially hidden') {
        jest
          .spyOn(document, 'visibilityState', 'get')
          .mockReturnValue('hidden');
      }
      mockReadiness.trackUsefulScreenVisibility();
      const measurement = register();

      if (reason === 'hidden during load') {
        jest
          .spyOn(document, 'visibilityState', 'get')
          .mockReturnValue('hidden');
        document.dispatchEvent(new Event('visibilitychange'));
      } else if (reason === 'closed') {
        window.dispatchEvent(new Event('pagehide'));
      }
      jest.spyOn(document, 'visibilityState', 'get').mockReturnValue('visible');
      measurement.reportReady();
      expect(startSpanManual).not.toHaveBeenCalled();
    },
  );

  jestIt.each([
    [undefined, 'unknown'],
    [performance.timeOrigin - 100, true],
    [performance.timeOrigin + 100, false],
  ])(
    'classifies background initialization time %s as %s',
    (initializedAt, expected) => {
      if (initializedAt !== undefined) {
        timing.recordBackgroundInitializationTiming({
          data: { method: 'BACKGROUND_INITIALIZED', params: { initializedAt } },
        });
      }
      mockReadiness.trackUsefulScreenVisibility();
      const measurement = register();
      measurement.reportReady();
      expect(setTag).toHaveBeenCalledWith(
        'ui.background_initialized_before_navigation',
        expected,
      );
    },
  );
});
