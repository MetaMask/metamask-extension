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
    it('returns run-level zeros for empty steps', () => {
      const results = buildLongTaskTimerResults([]);

      expect(results).toEqual([
        { id: 'longTaskCount', duration: 0 },
        { id: 'longTaskTotalDuration', duration: 0 },
        { id: 'longTaskMaxDuration', duration: 0 },
        { id: 'tbt', duration: 0 },
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
        },
      ];

      const results = buildLongTaskTimerResults(steps);

      expect(results).toEqual([
        { id: 'longTaskCount', duration: 3 },
        { id: 'longTaskTotalDuration', duration: 250 },
        { id: 'longTaskMaxDuration', duration: 120 },
        { id: 'tbt', duration: 100 },
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
        },
        {
          id: 'step_b',
          duration: 700,
          longTaskCount: 5,
          longTaskTotalDuration: 420,
          longTaskMaxDuration: 150,
          tbt: 170,
        },
        {
          id: 'step_c',
          duration: 200,
          longTaskCount: 1,
          longTaskTotalDuration: 60,
          longTaskMaxDuration: 60,
          tbt: 10,
        },
      ];

      const results = buildLongTaskTimerResults(steps);

      expect(results).toEqual([
        { id: 'longTaskCount', duration: 8 },
        { id: 'longTaskTotalDuration', duration: 660 },
        { id: 'longTaskMaxDuration', duration: 150 },
        { id: 'tbt', duration: 260 },
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
        },
        {
          id: 'second',
          duration: 100,
          longTaskCount: 1,
          longTaskTotalDuration: 80,
          longTaskMaxDuration: 80,
          tbt: 30,
        },
      ];

      const results = buildLongTaskTimerResults(steps);
      const maxEntry = results.find((r) => r.id === 'longTaskMaxDuration');

      expect(maxEntry?.duration).toBe(200);
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
        },
        {
          id: 'slow_step',
          duration: 400,
          longTaskCount: 2,
          longTaskTotalDuration: 180,
          longTaskMaxDuration: 110,
          tbt: 80,
        },
      ];

      const results = buildLongTaskTimerResults(steps);

      expect(results).toHaveLength(4);
      expect(results).toContainEqual({
        id: 'longTaskCount',
        duration: 2,
      });
      expect(results).toContainEqual({
        id: 'longTaskMaxDuration',
        duration: 110,
      });
    });
  });
});
