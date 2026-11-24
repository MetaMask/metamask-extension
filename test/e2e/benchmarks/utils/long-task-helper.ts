import { Driver } from '../../webdriver/driver';
import TimerHelper from './timer-helper';
import { performanceTracker } from './performance-tracker';
import { readLongTasksAtTrigger } from './in-page-step-timer';
import type { LongTasksAtTrigger } from './in-page-step-timer';
import type { LongTaskStepResult, TimerResult } from './types';

/**
 * Name for a step's harness-clock timer when the step also has an in-page timer
 * (`in-page-step-timer.ts`), which owns the bare step id. The harness timer
 * includes WebDriver round trips and polling, so it is not the app's latency.
 */
export function legacyStepTimerId(stepId: string): string {
  return `${stepId}Legacy`;
}

export type MeasureStepWithLongTasksOptions = {
  /**
   * Report the timer as `<stepId>Legacy` ({@link legacyStepTimerId}), leaving
   * the bare step id to the step's in-page timer.
   */
  legacyTimerId?: boolean;
  /**
   * The step's probe was asked to open the long-task window at the trigger
   * (`resetLongTasksAtStart`); the step reads whether it did, and logs when not.
   */
  windowOpensAtTrigger?: boolean;
};

/**
 * Open a step's long-task window where its probe did not already, and log
 * which of the two happened.
 */
async function openLongTaskWindow(
  driver: Driver,
  stepId: string,
  timerId: string,
): Promise<void> {
  let atTrigger: LongTasksAtTrigger | null = null;
  let why = 'the app has no reset hook, or the probe did not see the trigger';
  try {
    atTrigger = (await driver.executeScript(
      readLongTasksAtTrigger,
      stepId,
    )) as LongTasksAtTrigger;
  } catch (error) {
    why = `the page could not be read: ${(error as Error).message}`;
  }

  if (atTrigger?.reset) {
    const { metrics } = atTrigger;
    console.log(
      `[benchmark] ${timerId}: ${
        metrics
          ? `${metrics.count} long task(s), ${metrics.totalDuration} ms`
          : 'long-task hook absent'
      }, between the trigger and the step timer's start`,
    );
    return;
  }

  console.log(
    `[benchmark] ${timerId}: the long-task window did not open at the trigger (${why}); opening it after the click, so this run's long tasks cover a different span`,
  );
  await driver.resetLongTaskMetrics();
}

/**
 * Measure a benchmark step with its Long Task metrics delta: reset before the
 * action unless the probe opened the window at the trigger, collected after it.
 */
export async function measureStepWithLongTasks(
  driver: Driver,
  stepId: string,
  action: () => Promise<void>,
  {
    legacyTimerId = false,
    windowOpensAtTrigger = false,
  }: MeasureStepWithLongTasksOptions = {},
): Promise<LongTaskStepResult> {
  const timer = new TimerHelper(
    legacyTimerId ? legacyStepTimerId(stepId) : stepId,
  );

  if (windowOpensAtTrigger) {
    await openLongTaskWindow(driver, stepId, timer.id);
  } else {
    await driver.resetLongTaskMetrics();
  }

  await timer.measure(action);
  performanceTracker.addTimer(timer);

  const longTaskData = await driver.collectLongTaskMetrics();
  const duration = timer.getDuration() ?? 0;

  return {
    id: stepId,
    duration,
    longTaskCount: longTaskData?.count ?? 0,
    longTaskTotalDuration: longTaskData?.totalDuration ?? 0,
    longTaskMaxDuration: longTaskData?.maxDuration ?? 0,
    tbt: longTaskData?.tbt ?? 0,
    // `?? false` covers the hook being absent entirely; `observed` covers the
    // hook being present while `observe({ type: 'longtask' })` was rejected.
    // Both are absences and neither is a zero.
    longTasksObserved: longTaskData?.observed ?? false,
  };
}

/**
 * Convert step results into TimerResult[] with run-level long task totals.
 *
 * Emits `longTaskCount`, `longTaskTotalDuration`, `longTaskMaxDuration`,
 * `tbt` aggregated across all steps.
 *
 * @param steps - Array of step results from measureStepWithLongTasks
 * @returns TimerResult array to merge into benchmark run results
 */
export function buildLongTaskTimerResults(
  steps: LongTaskStepResult[],
): TimerResult[] {
  // Absent, not zero: with no step observed, omit these four metrics rather
  // than report zeros, as `cls` is omitted where it is absent.
  if (steps.length > 0 && !steps.some((step) => step.longTasksObserved)) {
    return [];
  }

  let totalCount = 0;
  let totalDuration = 0;
  let maxDuration = 0;
  let totalTbt = 0;

  for (const step of steps) {
    totalCount += step.longTaskCount;
    totalDuration += step.longTaskTotalDuration;
    maxDuration = Math.max(maxDuration, step.longTaskMaxDuration);
    totalTbt += step.tbt;
  }

  return [
    { id: 'longTaskCount', value: totalCount, unit: 'count' as const },
    {
      id: 'longTaskTotalDuration',
      value: totalDuration,
      unit: 'ms' as const,
    },
    { id: 'longTaskMaxDuration', value: maxDuration, unit: 'ms' as const },
    { id: 'tbt', value: totalTbt, unit: 'ms' as const },
  ];
}
