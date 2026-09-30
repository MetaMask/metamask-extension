import { Driver } from '../../webdriver/driver';
import TimerHelper from './timer-helper';
import { performanceTracker } from './performance-tracker';
import type { LongTaskStepResult, TimerResult } from './types';

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
): Promise<LongTaskStepResult> {
  const timer = new TimerHelper(stepId);

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
  // Absent, not zero. Where no step had the observer attached, these four
  // metrics are omitted from the artifact rather than reported as zeros, so a
  // reader and V13 see a metric that does not apply on this browser instead of
  // a quiet main thread. This is how `cls` already behaves where it is absent.
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
