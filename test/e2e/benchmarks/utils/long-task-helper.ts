import { Driver } from '../../webdriver/driver';
import TimerHelper from './timer-helper';
import { performanceTracker } from './performance-tracker';
import type { LongTaskStepResult, TimerResult } from './types';

/**
 * Name for a step's harness-clock timer when the step also has an in-page timer
 * (`in-page-step-timer.ts`), which owns the bare step id. The harness timer
 * starts after the triggering click returns, so it is not the app's latency.
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
};

/**
 * Measure a benchmark step while collecting Long Task metrics delta.
 *
 * Resets long task metrics before the action, times the action with
 * TimerHelper, then collects the delta. The TimerHelper is also
 * registered with performanceTracker for report generation.
 *
 * @param driver - Selenium driver instance
 * @param stepId - Unique identifier for this step (used as timer ID)
 * @param action - Async function to measure
 * @returns Step result with duration and long task metrics
 */
export async function measureStepWithLongTasks(
  driver: Driver,
  stepId: string,
  action: () => Promise<void>,
  { legacyTimerId = false }: MeasureStepWithLongTasksOptions = {},
): Promise<LongTaskStepResult> {
  const timer = new TimerHelper(
    legacyTimerId ? legacyStepTimerId(stepId) : stepId,
  );

  await driver.resetLongTaskMetrics();

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
