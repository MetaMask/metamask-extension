import {
  buildLongTaskTimerResults,
  legacyStepTimerId,
  measureStepWithLongTasks,
  stepLongAnimationFrameIds,
  toLongTaskStepResult,
} from './long-task-helper';
import { performanceTracker } from './performance-tracker';
import TimerHelper from './timer-helper';
import type { LongTaskStepResult } from './types';

jest.mock('./timer-helper', () => {
  return {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    __esModule: true,
    default: jest.fn().mockImplementation((id: string) => ({
      id,
      measure: jest.fn(async (action: () => Promise<void>) => {
        await action();
      }),
      getDuration: jest.fn(() => 42),
    })),
  };
});

jest.mock('./performance-tracker', () => ({
  performanceTracker: { addTimer: jest.fn() },
}));

/** A step on which the `long-animation-frame` observer did not attach. */
const NO_FRAMES = {
  longAnimationFrameCount: 0,
  longAnimationFrameTotalDuration: 0,
  longAnimationFrameBlockingDuration: 0,
  longAnimationFramesObserved: false,
};

describe('long-task-helper', () => {
  describe('legacyStepTimerId', () => {
    it('appends Legacy to the step id', () => {
      expect(legacyStepTimerId('openSwapPageFromHome')).toBe(
        'openSwapPageFromHomeLegacy',
      );
      expect(legacyStepTimerId('bridge_load_page')).toBe(
        'bridge_load_pageLegacy',
      );
    });
  });

  describe('measureStepWithLongTasks', () => {
    it('reports its timer under the step id by default', async () => {
      const mockDriver = {
        resetLongTaskMetrics: jest.fn(),
        collectLongTaskMetrics: jest.fn().mockResolvedValue(null),
      } as unknown as import('../../webdriver/driver').Driver;

      const result = await measureStepWithLongTasks(
        mockDriver,
        'namedStep',
        async () => undefined,
      );

      expect(TimerHelper).toHaveBeenLastCalledWith('namedStep');
      expect(performanceTracker.addTimer).toHaveBeenLastCalledWith(
        expect.objectContaining({ id: 'namedStep' }),
      );
      expect(result.id).toBe('namedStep');
    });

    it('reports its timer as the step id plus Legacy when asked, and returns the step id', async () => {
      const mockDriver = {
        resetLongTaskMetrics: jest.fn(),
        collectLongTaskMetrics: jest.fn().mockResolvedValue(null),
      } as unknown as import('../../webdriver/driver').Driver;

      const result = await measureStepWithLongTasks(
        mockDriver,
        'namedStep',
        async () => undefined,
        { legacyTimerId: true },
      );

      expect(TimerHelper).toHaveBeenLastCalledWith('namedStepLegacy');
      expect(performanceTracker.addTimer).toHaveBeenLastCalledWith(
        expect.objectContaining({ id: 'namedStepLegacy' }),
      );
      expect(result.id).toBe('namedStep');
    });

    it('resets metrics, runs action, and returns step result', async () => {
      const mockDriver = {
        resetLongTaskMetrics: jest.fn(),
        collectLongTaskMetrics: jest.fn().mockResolvedValue({
          count: 2,
          totalDuration: 180,
          maxDuration: 110,
          tbt: 80,
          observed: true,
          tbtRating: 'good',
        }),
      } as unknown as import('../../webdriver/driver').Driver;

      let actionCalled = false;
      const result = await measureStepWithLongTasks(
        mockDriver,
        'testStep',
        async () => {
          actionCalled = true;
        },
      );

      expect(actionCalled).toBe(true);
      expect(mockDriver.resetLongTaskMetrics).toHaveBeenCalled();
      expect(mockDriver.collectLongTaskMetrics).toHaveBeenCalled();
      expect(result).toEqual({
        id: 'testStep',
        duration: 42,
        longTaskCount: 2,
        longTaskTotalDuration: 180,
        longTaskMaxDuration: 110,
        tbt: 80,
        longTasksObserved: true,
        longAnimationFrameCount: 0,
        longAnimationFrameTotalDuration: 0,
        longAnimationFrameBlockingDuration: 0,
        longAnimationFramesObserved: false,
      });
    });

    it('runs the trigger after the windows open and before the timer starts', async () => {
      const mockDriver = {
        resetLongTaskMetrics: jest.fn(),
        collectLongTaskMetrics: jest.fn().mockResolvedValue(null),
      };
      const trigger = jest.fn(async () => undefined);
      const action = jest.fn(async () => undefined);

      await measureStepWithLongTasks(
        mockDriver as unknown as import('../../webdriver/driver').Driver,
        'triggeredStep',
        action,
        { trigger },
      );

      const timer = (TimerHelper as unknown as jest.Mock).mock.results.at(-1)
        ?.value as { measure: jest.Mock };
      const first = (fn: jest.Mock) => fn.mock.invocationCallOrder[0];
      expect(first(mockDriver.resetLongTaskMetrics)).toBeLessThan(
        first(trigger),
      );
      expect(first(trigger)).toBeLessThan(first(timer.measure));
      expect(first(timer.measure)).toBeLessThan(first(action));
      expect(first(action)).toBeLessThan(
        first(mockDriver.collectLongTaskMetrics),
      );
    });

    it('defaults to zeros when collectLongTaskMetrics returns null', async () => {
      const mockDriver = {
        resetLongTaskMetrics: jest.fn(),
        collectLongTaskMetrics: jest.fn().mockResolvedValue(null),
      } as unknown as import('../../webdriver/driver').Driver;

      const result = await measureStepWithLongTasks(
        mockDriver,
        'nullStep',
        async () => undefined,
      );

      expect(result.longTaskCount).toBe(0);
      expect(result.longTaskTotalDuration).toBe(0);
      expect(result.longTaskMaxDuration).toBe(0);
      expect(result.tbt).toBe(0);
    });
  });

  describe('buildLongTaskTimerResults', () => {
    // extension#46664's sibling defect: `PerformanceObserver` rejects the
    // `longtask` type outside Chromium, the metrics object keeps its
    // initialised zeros, and a reader cannot tell that from a quiet main
    // thread. Firefox read 0 in 60 of 60 runs on all 12 benchmarks.
    it('omits the metrics entirely when no step had the observer attached', () => {
      const steps = [
        {
          id: 'a',
          duration: 10,
          longTaskCount: 0,
          longTaskTotalDuration: 0,
          longTaskMaxDuration: 0,
          tbt: 0,
          longTasksObserved: false,
          ...NO_FRAMES,
        },
        {
          id: 'b',
          duration: 20,
          longTaskCount: 0,
          longTaskTotalDuration: 0,
          longTaskMaxDuration: 0,
          tbt: 0,
          longTasksObserved: false,
          ...NO_FRAMES,
        },
      ];

      expect(buildLongTaskTimerResults(steps)).toStrictEqual([]);
    });

    it('emits the metrics when at least one step observed, zeros included', () => {
      const steps = [
        {
          id: 'a',
          duration: 10,
          longTaskCount: 0,
          longTaskTotalDuration: 0,
          longTaskMaxDuration: 0,
          tbt: 0,
          longTasksObserved: true,
          ...NO_FRAMES,
        },
      ];

      const results = buildLongTaskTimerResults(steps);

      // An observed zero is a measurement and must survive.
      expect(results.map((r) => r.id)).toStrictEqual([
        'longTaskCount',
        'longTaskTotalDuration',
        'longTaskMaxDuration',
        'tbt',
      ]);
      expect(results[0].value).toBe(0);
    });

    it('returns run-level zeros for empty steps', () => {
      const results = buildLongTaskTimerResults([]);

      expect(results).toEqual([
        { id: 'longTaskCount', value: 0, unit: 'count' },
        { id: 'longTaskTotalDuration', value: 0, unit: 'ms' },
        { id: 'longTaskMaxDuration', value: 0, unit: 'ms' },
        { id: 'tbt', value: 0, unit: 'ms' },
      ]);
    });

    it('produces run-level aggregates for a single step', () => {
      const steps: LongTaskStepResult[] = [
        {
          id: 'loginStep',
          duration: 500,
          longTaskCount: 3,
          longTaskTotalDuration: 250,
          longTaskMaxDuration: 120,
          tbt: 100,
          longTasksObserved: true,
          ...NO_FRAMES,
        },
      ];

      const results = buildLongTaskTimerResults(steps);

      expect(results).toEqual([
        { id: 'longTaskCount', value: 3, unit: 'count' },
        { id: 'longTaskTotalDuration', value: 250, unit: 'ms' },
        { id: 'longTaskMaxDuration', value: 120, unit: 'ms' },
        { id: 'tbt', value: 100, unit: 'ms' },
      ]);
    });

    it('aggregates across multiple steps correctly', () => {
      const steps: LongTaskStepResult[] = [
        {
          id: 'step_a',
          duration: 300,
          longTaskCount: 2,
          longTaskTotalDuration: 180,
          longTaskMaxDuration: 100,
          tbt: 80,
          longTasksObserved: true,
          ...NO_FRAMES,
        },
        {
          id: 'step_b',
          duration: 700,
          longTaskCount: 5,
          longTaskTotalDuration: 420,
          longTaskMaxDuration: 150,
          tbt: 170,
          longTasksObserved: true,
          ...NO_FRAMES,
        },
        {
          id: 'step_c',
          duration: 200,
          longTaskCount: 1,
          longTaskTotalDuration: 60,
          longTaskMaxDuration: 60,
          tbt: 10,
          longTasksObserved: true,
          ...NO_FRAMES,
        },
      ];

      const results = buildLongTaskTimerResults(steps);

      expect(results).toEqual([
        { id: 'longTaskCount', value: 8, unit: 'count' },
        { id: 'longTaskTotalDuration', value: 660, unit: 'ms' },
        { id: 'longTaskMaxDuration', value: 150, unit: 'ms' },
        { id: 'tbt', value: 260, unit: 'ms' },
      ]);
    });

    it('picks the global max across steps for longTaskMaxDuration', () => {
      const steps: LongTaskStepResult[] = [
        {
          id: 'first',
          duration: 100,
          longTaskCount: 1,
          longTaskTotalDuration: 200,
          longTaskMaxDuration: 200,
          tbt: 150,
          longTasksObserved: true,
          ...NO_FRAMES,
        },
        {
          id: 'second',
          duration: 100,
          longTaskCount: 1,
          longTaskTotalDuration: 80,
          longTaskMaxDuration: 80,
          tbt: 30,
          longTasksObserved: true,
          ...NO_FRAMES,
        },
      ];

      const results = buildLongTaskTimerResults(steps);
      const maxEntry = results.find((r) => r.id === 'longTaskMaxDuration');

      expect(maxEntry?.value).toBe(200);
    });

    it('handles steps with zero long tasks', () => {
      const steps: LongTaskStepResult[] = [
        {
          id: 'fast_step',
          duration: 50,
          longTaskCount: 0,
          longTaskTotalDuration: 0,
          longTaskMaxDuration: 0,
          tbt: 0,
          longTasksObserved: true,
          ...NO_FRAMES,
        },
        {
          id: 'slow_step',
          duration: 400,
          longTaskCount: 2,
          longTaskTotalDuration: 180,
          longTaskMaxDuration: 110,
          tbt: 80,
          longTasksObserved: true,
          ...NO_FRAMES,
        },
      ];

      const results = buildLongTaskTimerResults(steps);

      expect(results).toHaveLength(4);
      expect(results).toContainEqual({
        id: 'longTaskCount',
        value: 2,
        unit: 'count',
      });
      expect(results).toContainEqual({
        id: 'longTaskMaxDuration',
        value: 110,
        unit: 'ms',
      });
    });
  });

  describe('toLongTaskStepResult', () => {
    it('reads the Long Animation Frame metrics from the same collected object', () => {
      expect(
        toLongTaskStepResult('step', 120, {
          count: 1,
          totalDuration: 110,
          maxDuration: 110,
          tbt: 60,
          observed: true,
          longAnimationFrames: {
            count: 2,
            totalDuration: 230,
            blockingDuration: 140,
            observed: true,
          },
        }),
      ).toStrictEqual({
        id: 'step',
        duration: 120,
        longTaskCount: 1,
        longTaskTotalDuration: 110,
        longTaskMaxDuration: 110,
        tbt: 60,
        longTasksObserved: true,
        longAnimationFrameCount: 2,
        longAnimationFrameTotalDuration: 230,
        longAnimationFrameBlockingDuration: 140,
        longAnimationFramesObserved: true,
      });
    });

    it('marks frames unobserved where the page exposes no frame hook', () => {
      const result = toLongTaskStepResult('step', 120, {
        count: 1,
        totalDuration: 110,
        maxDuration: 110,
        tbt: 60,
        observed: true,
        longAnimationFrames: null,
      });

      expect(result.longTasksObserved).toBe(true);
      expect(result).toMatchObject(NO_FRAMES);
    });

    it('marks both families unobserved when nothing was collected', () => {
      const result = toLongTaskStepResult('step', 120, null);

      expect(result.longTasksObserved).toBe(false);
      expect(result).toMatchObject(NO_FRAMES);
    });
  });

  describe('measureStepWithLongTasks, Long Animation Frames', () => {
    it('returns the frame metrics from the one collect call that closes the step', async () => {
      const mockDriver = {
        resetLongTaskMetrics: jest.fn(),
        collectLongTaskMetrics: jest.fn().mockResolvedValue({
          count: 0,
          totalDuration: 0,
          maxDuration: 0,
          tbt: 0,
          observed: true,
          longAnimationFrames: {
            count: 1,
            totalDuration: 64,
            blockingDuration: 14,
            observed: true,
          },
        }),
      } as unknown as import('../../webdriver/driver').Driver;

      const result = await measureStepWithLongTasks(
        mockDriver,
        'framesStep',
        async () => undefined,
      );

      expect(mockDriver.resetLongTaskMetrics).toHaveBeenCalledTimes(1);
      expect(mockDriver.collectLongTaskMetrics).toHaveBeenCalledTimes(1);
      expect(result).toMatchObject({
        longAnimationFrameCount: 1,
        longAnimationFrameTotalDuration: 64,
        longAnimationFrameBlockingDuration: 14,
        longAnimationFramesObserved: true,
      });
    });
  });

  describe('buildLongTaskTimerResults, Long Animation Frames', () => {
    const LONG_TASKS = {
      longTaskCount: 1,
      longTaskTotalDuration: 120,
      longTaskMaxDuration: 120,
      tbt: 70,
      longTasksObserved: true,
    };

    it('emits the run-level sums beside the long-task metrics, then each step', () => {
      const steps: LongTaskStepResult[] = [
        {
          id: 'step_a',
          duration: 300,
          ...LONG_TASKS,
          longAnimationFrameCount: 2,
          longAnimationFrameTotalDuration: 180,
          longAnimationFrameBlockingDuration: 90,
          longAnimationFramesObserved: true,
        },
        {
          id: 'step_b',
          duration: 200,
          ...LONG_TASKS,
          longAnimationFrameCount: 1,
          longAnimationFrameTotalDuration: 70,
          longAnimationFrameBlockingDuration: 20,
          longAnimationFramesObserved: true,
        },
      ];

      expect(buildLongTaskTimerResults(steps)).toStrictEqual([
        { id: 'longTaskCount', value: 2, unit: 'count' },
        { id: 'longTaskTotalDuration', value: 240, unit: 'ms' },
        { id: 'longTaskMaxDuration', value: 120, unit: 'ms' },
        { id: 'tbt', value: 140, unit: 'ms' },
        { id: 'longAnimationFrameCount', value: 3, unit: 'count' },
        { id: 'longAnimationFrameTotalDuration', value: 250, unit: 'ms' },
        { id: 'longAnimationFrameBlockingDuration', value: 110, unit: 'ms' },
        { id: 'step_aLongAnimationFrameCount', value: 2, unit: 'count' },
        { id: 'step_aLongAnimationFrameTotalDuration', value: 180, unit: 'ms' },
        {
          id: 'step_aLongAnimationFrameBlockingDuration',
          value: 90,
          unit: 'ms',
        },
        { id: 'step_bLongAnimationFrameCount', value: 1, unit: 'count' },
        { id: 'step_bLongAnimationFrameTotalDuration', value: 70, unit: 'ms' },
        {
          id: 'step_bLongAnimationFrameBlockingDuration',
          value: 20,
          unit: 'ms',
        },
      ]);
    });

    it('keeps an observed zero, which is a measurement', () => {
      const results = buildLongTaskTimerResults([
        {
          id: 'quiet',
          duration: 50,
          ...LONG_TASKS,
          longAnimationFrameCount: 0,
          longAnimationFrameTotalDuration: 0,
          longAnimationFrameBlockingDuration: 0,
          longAnimationFramesObserved: true,
        },
      ]);

      expect(results).toContainEqual({
        id: 'longAnimationFrameTotalDuration',
        value: 0,
        unit: 'ms',
      });
      expect(results).toContainEqual({
        id: 'quietLongAnimationFrameTotalDuration',
        value: 0,
        unit: 'ms',
      });
    });

    it('omits the frame metrics, and keeps the long-task ones, when no step observed frames', () => {
      const results = buildLongTaskTimerResults([
        { id: 'a', duration: 10, ...LONG_TASKS, ...NO_FRAMES },
      ]);

      expect(results.map((r) => r.id)).toStrictEqual([
        'longTaskCount',
        'longTaskTotalDuration',
        'longTaskMaxDuration',
        'tbt',
      ]);
    });

    it('emits the frame metrics when frames were observed and long tasks were not', () => {
      const results = buildLongTaskTimerResults([
        {
          id: 'a',
          duration: 10,
          longTaskCount: 0,
          longTaskTotalDuration: 0,
          longTaskMaxDuration: 0,
          tbt: 0,
          longTasksObserved: false,
          longAnimationFrameCount: 1,
          longAnimationFrameTotalDuration: 60,
          longAnimationFrameBlockingDuration: 10,
          longAnimationFramesObserved: true,
        },
      ]);

      expect(results.map((r) => r.id)).toStrictEqual([
        'longAnimationFrameCount',
        'longAnimationFrameTotalDuration',
        'longAnimationFrameBlockingDuration',
        'aLongAnimationFrameCount',
        'aLongAnimationFrameTotalDuration',
        'aLongAnimationFrameBlockingDuration',
      ]);
    });

    it('leaves out the per-step metrics of a step that did not observe frames', () => {
      const results = buildLongTaskTimerResults([
        {
          id: 'seen',
          duration: 10,
          ...LONG_TASKS,
          longAnimationFrameCount: 1,
          longAnimationFrameTotalDuration: 60,
          longAnimationFrameBlockingDuration: 10,
          longAnimationFramesObserved: true,
        },
        { id: 'unseen', duration: 10, ...LONG_TASKS, ...NO_FRAMES },
      ]);
      const ids = results.map((r) => r.id);

      expect(ids).toContain('seenLongAnimationFrameTotalDuration');
      expect(ids.some((id) => id.startsWith('unseen'))).toBe(false);
    });

    it('tags every frame metric with a unit, keeping it out of the per-run total', () => {
      const results = buildLongTaskTimerResults([
        {
          id: 'a',
          duration: 10,
          ...LONG_TASKS,
          longAnimationFrameCount: 1,
          longAnimationFrameTotalDuration: 60,
          longAnimationFrameBlockingDuration: 10,
          longAnimationFramesObserved: true,
        },
      ]);

      expect(
        results
          .filter(
            (r) =>
              r.id.includes('LongAnimationFrame') ||
              r.id.startsWith('longAnimationFrame'),
          )
          .every((r) => r.unit !== undefined),
      ).toBe(true);
    });
  });

  describe('stepLongAnimationFrameIds', () => {
    it('suffixes the step id, as legacyStepTimerId does', () => {
      expect(stepLongAnimationFrameIds('load_new_account')).toStrictEqual({
        count: 'load_new_accountLongAnimationFrameCount',
        totalDuration: 'load_new_accountLongAnimationFrameTotalDuration',
        blockingDuration: 'load_new_accountLongAnimationFrameBlockingDuration',
      });
    });
  });
});
