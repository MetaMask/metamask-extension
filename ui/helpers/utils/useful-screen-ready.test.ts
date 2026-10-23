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
  const getEntriesByType = jest.fn();
  let timing: typeof Timing;
  let getEntriesByTypeDescriptor: PropertyDescriptor | undefined;

  const register = () =>
    mockReadiness.registerDocumentLoadMeasurement({
      screen: 'example',
      tags: { 'example.initial_state': true },
    });

  beforeEach(() => {
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
      value: getEntriesByType.mockReturnValue([]),
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
  });

  it('records document loading until the page explicitly reports readiness', () => {
    const now = jest.spyOn(performance, 'now').mockReturnValue(400);
    mockReadiness.trackUsefulScreenVisibility();
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
      mockReadiness.trackUsefulScreenVisibility();
      const measurement = register();

      measurement[finish]();
      measurement.reportReady();
      measurement.discard();
      register().reportReady();

      expect(trace).toHaveBeenCalledTimes(finish === 'reportReady' ? 1 : 0);
    },
  );

  jestIt.each([
    { states: ['visible'], samples: 1 },
    { states: ['visible', 'hidden', 'visible'], samples: 0 },
  ])(
    'records $samples samples for visibility history $states',
    ({ states, samples }) => {
      getEntriesByType.mockReturnValue(states.map((name) => ({ name })));

      mockReadiness.trackUsefulScreenVisibility();
      const measurement = register();
      measurement.reportReady();

      expect(trace).toHaveBeenCalledTimes(samples);
    },
  );

  jestIt.each([
    ['visibilitychange', true],
    ['visibilitychange', false],
    ['pagehide', true],
    ['pagehide', false],
  ] as const)(
    'excludes %s events, before registration: %s',
    (event, beforeRegistration) => {
      mockReadiness.trackUsefulScreenVisibility();
      const measurement = beforeRegistration ? undefined : register();
      const visibility = jest.spyOn(document, 'visibilityState', 'get');

      visibility.mockReturnValue('hidden');
      (event === 'pagehide' ? window : document).dispatchEvent(
        new Event(event),
      );
      visibility.mockReturnValue('visible');
      (measurement ?? register()).reportReady();

      expect(trace).not.toHaveBeenCalled();
    },
  );

  it('excludes a document that is initially hidden', () => {
    const visibility = jest
      .spyOn(document, 'visibilityState', 'get')
      .mockReturnValue('hidden');
    mockReadiness.trackUsefulScreenVisibility();
    visibility.mockReturnValue('visible');
    register().reportReady();
    expect(trace).not.toHaveBeenCalled();
  });

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
