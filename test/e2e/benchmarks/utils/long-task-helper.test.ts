import { readLongTasksAtTrigger } from './in-page-step-timer';
import {
  buildLongTaskTimerResults,
  legacyStepTimerId,
  measureStepWithLongTasks,
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
      });
    });

    it('resets before the action by default', async () => {
      const order: string[] = [];
      const mockDriver = {
        resetLongTaskMetrics: jest.fn(async () => {
          order.push('reset');
        }),
        executeScript: jest.fn(),
        collectLongTaskMetrics: jest.fn(async () => {
          order.push('collect');
          return null;
        }),
      } as unknown as import('../../webdriver/driver').Driver;

      await measureStepWithLongTasks(mockDriver, 'step', async () => {
        order.push('action');
      });

      expect(order).toStrictEqual(['reset', 'action', 'collect']);
      expect(mockDriver.executeScript).not.toHaveBeenCalled();
    });

    it('when the window opens at the trigger, reads without resetting where the reset was, and logs what it read', async () => {
      const log = jest
        .spyOn(console, 'log')
        .mockImplementation(() => undefined);
      const order: string[] = [];
      const mockDriver = {
        resetLongTaskMetrics: jest.fn(),
        executeScript: jest.fn(async () => {
          order.push('read');
          return { reset: true, metrics: { count: 1, totalDuration: 70 } };
        }),
        collectLongTaskMetrics: jest.fn(async () => {
          order.push('collect');
          return {
            count: 3,
            totalDuration: 250,
            maxDuration: 120,
            tbt: 100,
            observed: true,
            tbtRating: 'good',
          };
        }),
      } as unknown as import('../../webdriver/driver').Driver;

      const result = await measureStepWithLongTasks(
        mockDriver,
        'step',
        async () => {
          order.push('action');
        },
        { legacyTimerId: true, windowOpensAtTrigger: true },
      );

      expect(mockDriver.resetLongTaskMetrics).not.toHaveBeenCalled();
      expect(mockDriver.executeScript).toHaveBeenCalledTimes(1);
      expect(mockDriver.executeScript).toHaveBeenCalledWith(
        readLongTasksAtTrigger,
        'step',
      );
      expect(order).toStrictEqual(['read', 'action', 'collect']);
      // The collected window, which runs from the trigger, is the result.
      expect(result).toMatchObject({ longTaskCount: 3, tbt: 100 });
      expect(log).toHaveBeenCalledWith(
        "[benchmark] stepLegacy: 1 long task(s), 70 ms, between the trigger and the step timer's start",
      );
      log.mockRestore();
    });

    describe('when the window was asked to open at the trigger and did not', () => {
      /**
       * Run a step that asks for the window, over a read that answers `read`.
       * @param read - What the page call does.
       * @returns The driver, the log and the order of the driver calls.
       */
      async function runWhere(read: () => Promise<unknown>) {
        const log = jest
          .spyOn(console, 'log')
          .mockImplementation(() => undefined);
        const order: string[] = [];
        const mockDriver = {
          resetLongTaskMetrics: jest.fn(async () => {
            order.push('reset');
          }),
          executeScript: jest.fn(read),
          collectLongTaskMetrics: jest.fn(async () => {
            order.push('collect');
            return null;
          }),
        } as unknown as import('../../webdriver/driver').Driver;

        await measureStepWithLongTasks(
          mockDriver,
          'step',
          async () => {
            order.push('action');
          },
          { windowOpensAtTrigger: true },
        );
        return { mockDriver, log, order };
      }

      it('opens the window after the click and says so when the probe did not reset', async () => {
        const { mockDriver, log, order } = await runWhere(async () => ({
          reset: false,
          metrics: { count: 0, totalDuration: 0 },
        }));

        expect(order).toStrictEqual(['reset', 'action', 'collect']);
        expect(mockDriver.executeScript).toHaveBeenCalledTimes(1);
        expect(log).toHaveBeenCalledWith(
          expect.stringContaining(
            '[benchmark] step: the long-task window did not open at the trigger (the app has no reset hook, or the probe did not see the trigger); opening it after the click',
          ),
        );
        log.mockRestore();
      });

      it('opens the window after the click and says why when the page cannot be read', async () => {
        const { order, log } = await runWhere(async () => {
          throw new Error('javascript error');
        });

        expect(order).toStrictEqual(['reset', 'action', 'collect']);
        expect(log).toHaveBeenCalledWith(
          expect.stringContaining(
            'did not open at the trigger (the page could not be read: javascript error)',
          ),
        );
        log.mockRestore();
      });

      it('says the hook is absent, not zero, where the probe reset but the app cannot report', async () => {
        const { order, log } = await runWhere(async () => ({
          reset: true,
          metrics: null,
        }));

        expect(order).toStrictEqual(['action', 'collect']);
        expect(log).toHaveBeenCalledWith(
          "[benchmark] step: long-task hook absent, between the trigger and the step timer's start",
        );
        log.mockRestore();
      });
    });

    describe('against an app that records a long task at the click', () => {
      type Host = {
        stateHooks?: {
          getLongTaskMetricsWithTBT?: (reset?: boolean) => unknown;
        };
        // eslint-disable-next-line @typescript-eslint/naming-convention
        __benchSteps?: Record<string, { longTasksReset: boolean }>;
      };
      const host = window as unknown as Host;

      /**
       * A driver over a fake long-task store shaped like the app's hooks: the
       * `reset` argument of `getLongTaskMetricsWithTBT` and the reset hook
       * clear it, a read without `reset` does not.
       */
      function driverOverStore() {
        let count = 0;
        let totalDuration = 0;
        const read = (reset = false) => {
          const metrics = {
            count,
            totalDuration,
            maxDuration: totalDuration,
            tbt: 0,
            observed: true,
            tbtRating: 'good',
          };
          if (reset) {
            count = 0;
            totalDuration = 0;
          }
          return metrics;
        };
        host.stateHooks = { getLongTaskMetricsWithTBT: read };
        const driver = {
          resetLongTaskMetrics: jest.fn(async () => {
            count = 0;
            totalDuration = 0;
          }),
          executeScript: jest.fn(
            async (script: (args: unknown[]) => unknown, ...args: unknown[]) =>
              script(args),
          ),
          collectLongTaskMetrics: jest.fn(async () => read(true)),
        } as unknown as import('../../webdriver/driver').Driver;
        const recordLongTask = (duration: number) => {
          count += 1;
          totalDuration += duration;
        };
        return { driver, recordLongTask };
      }

      beforeEach(() => {
        // The probe has reset the app's metrics at the trigger.
        host.__benchSteps = { step: { longTasksReset: true } };
      });
      afterEach(() => {
        delete host.stateHooks;
        delete host.__benchSteps;
      });

      it('loses the long task when the step resets after the click', async () => {
        const log = jest
          .spyOn(console, 'log')
          .mockImplementation(() => undefined);
        const { driver, recordLongTask } = driverOverStore();

        // The click has returned and left a 66 ms long task behind.
        recordLongTask(66);
        const result = await measureStepWithLongTasks(
          driver,
          'step',
          async () => undefined,
        );

        expect(result).toMatchObject({
          longTaskCount: 0,
          longTaskTotalDuration: 0,
        });
        log.mockRestore();
      });

      it('keeps the long task when the window opened at the trigger', async () => {
        const log = jest
          .spyOn(console, 'log')
          .mockImplementation(() => undefined);
        const { driver, recordLongTask } = driverOverStore();

        recordLongTask(66);
        const result = await measureStepWithLongTasks(
          driver,
          'step',
          async () => {
            recordLongTask(30);
          },
          { windowOpensAtTrigger: true },
        );

        expect(result).toMatchObject({
          longTaskCount: 2,
          longTaskTotalDuration: 96,
        });
        expect(log).toHaveBeenCalledWith(
          "[benchmark] step: 1 long task(s), 66 ms, between the trigger and the step timer's start",
        );
        log.mockRestore();
      });

      it("reads the app's metrics in the page without resetting them", async () => {
        const log = jest
          .spyOn(console, 'log')
          .mockImplementation(() => undefined);
        const getLongTaskMetricsWithTBT = jest.fn(() => ({
          count: 2,
          totalDuration: 90,
        }));
        host.stateHooks = { getLongTaskMetricsWithTBT };
        let pageFunction: ((args: unknown[]) => unknown) | undefined;
        const mockDriver = {
          executeScript: jest.fn(
            async (
              script: (args: unknown[]) => unknown,
              ...args: unknown[]
            ) => {
              pageFunction = script;
              return script(args);
            },
          ),
          collectLongTaskMetrics: jest.fn(async () => null),
        } as unknown as import('../../webdriver/driver').Driver;

        await measureStepWithLongTasks(
          mockDriver,
          'step',
          async () => undefined,
          { windowOpensAtTrigger: true },
        );

        expect(getLongTaskMetricsWithTBT).toHaveBeenCalledWith(false);
        delete host.stateHooks;
        expect(pageFunction?.(['step'])).toMatchObject({ metrics: null });
        log.mockRestore();
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
