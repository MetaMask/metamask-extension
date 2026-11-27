import {
  buildLongTaskTimerResults,
  measureStepWithLongTasks,
} from './long-task-helper';
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

describe('long-task-helper', () => {
  describe('measureStepWithLongTasks', () => {
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
      });
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
        },
        {
          id: 'b',
          duration: 20,
          longTaskCount: 0,
          longTaskTotalDuration: 0,
          longTaskMaxDuration: 0,
          tbt: 0,
          longTasksObserved: false,
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
        },
        {
          id: 'step_b',
          duration: 700,
          longTaskCount: 5,
          longTaskTotalDuration: 420,
          longTaskMaxDuration: 150,
          tbt: 170,
          longTasksObserved: true,
        },
        {
          id: 'step_c',
          duration: 200,
          longTaskCount: 1,
          longTaskTotalDuration: 60,
          longTaskMaxDuration: 60,
          tbt: 10,
          longTasksObserved: true,
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
        },
        {
          id: 'second',
          duration: 100,
          longTaskCount: 1,
          longTaskTotalDuration: 80,
          longTaskMaxDuration: 80,
          tbt: 30,
          longTasksObserved: true,
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
        },
        {
          id: 'slow_step',
          duration: 400,
          longTaskCount: 2,
          longTaskTotalDuration: 180,
          longTaskMaxDuration: 110,
          tbt: 80,
          longTasksObserved: true,
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
});
