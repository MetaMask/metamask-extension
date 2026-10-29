import { it as jestIt } from '@jest/globals';
import {
  trace,
  endTrace,
  TraceName,
  TraceOperation,
} from '../../../shared/lib/trace';
import type * as Timing from '../../../shared/lib/ui-startup-timing';
import type * as Readiness from './useful-screen-ready';

let mockReadiness: typeof Readiness;

jest.mock('../../../shared/lib/trace', () => ({
  ...jest.requireActual('../../../shared/lib/trace'),
  trace: jest.fn(),
  endTrace: jest.fn(),
}));

describe('registerDocumentLoadMeasurement', () => {
  let timing: typeof Timing;

  const register = () =>
    mockReadiness.registerDocumentLoadMeasurement({
      screen: 'example',
      tags: { 'example.initial_state': true },
    });

  beforeEach(() => {
    jest.clearAllMocks();
    jest.isolateModules(() => {
      mockReadiness = jest.requireActual('./useful-screen-ready');
      timing = jest.requireActual('../../../shared/lib/ui-startup-timing');
    });
  });

  afterEach(() => {
    window.dispatchEvent(new Event('pagehide'));
  });

  it('records document loading until the page explicitly reports readiness', () => {
    const now = jest.spyOn(performance, 'now').mockReturnValue(400);
    mockReadiness.trackDocumentPageClose();
    const tags = { 'example.initial_state': true };
    const measurement = mockReadiness.registerDocumentLoadMeasurement({
      screen: 'example',
      tags,
    });
    tags['example.initial_state'] = false;
    now.mockReturnValue(432);
    expect(trace).not.toHaveBeenCalled();

    measurement.reportReady();

    expect(trace).toHaveBeenCalledWith({
      name: TraceName.UsefulScreenReady,
      op: TraceOperation.UiScreenPerformance,
      startTime: performance.timeOrigin,
      allowActiveSpanFallback: true,
      tags: expect.objectContaining({
        screen: 'example',
        'example.initial_state': true,
      }),
      data: { success: true },
    });
    expect(endTrace).toHaveBeenCalledWith({
      name: TraceName.UsefulScreenReady,
      timestamp: performance.timeOrigin + 432,
    });
  });

  jestIt.each(['reportReady', 'discard'] as const)(
    'permanently ends document sampling after %s',
    (finish) => {
      mockReadiness.trackDocumentPageClose();
      const measurement = register();

      measurement[finish]();
      measurement.reportReady();
      measurement.discard();
      register().reportReady();

      expect(trace).toHaveBeenCalledTimes(finish === 'reportReady' ? 1 : 0);
    },
  );

  jestIt.each([true, false])(
    'excludes page close before registration: %s',
    (beforeRegistration) => {
      mockReadiness.trackDocumentPageClose();
      const measurement = beforeRegistration ? undefined : register();

      window.dispatchEvent(new Event('pagehide'));
      (measurement ?? register()).reportReady();

      expect(trace).not.toHaveBeenCalled();
    },
  );

  jestIt.each(['hidden', 'visible'] as const)(
    'records an initially hidden document when readiness is reported while %s',
    (readyVisibility) => {
      const visibility = jest
        .spyOn(document, 'visibilityState', 'get')
        .mockReturnValue('hidden');
      mockReadiness.trackDocumentPageClose();
      const measurement = register();

      visibility.mockReturnValue(readyVisibility);
      measurement.reportReady();

      expect(trace).toHaveBeenCalledTimes(1);
    },
  );

  jestIt.each([true, false])(
    'records readiness after visibility changes before registration: %s',
    (beforeRegistration) => {
      const visibility = jest
        .spyOn(document, 'visibilityState', 'get')
        .mockReturnValue('visible');
      mockReadiness.trackDocumentPageClose();
      const measurement = beforeRegistration ? undefined : register();

      visibility.mockReturnValue('hidden');
      document.dispatchEvent(new Event('visibilitychange'));
      visibility.mockReturnValue('visible');
      document.dispatchEvent(new Event('visibilitychange'));
      (measurement ?? register()).reportReady();

      expect(trace).toHaveBeenCalledTimes(1);
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
      mockReadiness.trackDocumentPageClose();
      const measurement = register();
      measurement.reportReady();
      expect(trace).toHaveBeenCalledWith(
        expect.objectContaining({
          tags: expect.objectContaining({
            'ui.background_initialized_before_navigation': expected,
          }),
        }),
      );
    },
  );
});
