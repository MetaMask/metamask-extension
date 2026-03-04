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
  };
}

/**
 * Convert step results into TimerResult[] with per-step longTaskCount
 * entries and run-level long task totals.
 *
 * Per-step: emits `{stepId}.longTaskCount` for each step.
 * Run-level: emits `longTaskCount`, `longTaskTotalDuration`,
 * `longTaskMaxDuration`, `tbt` aggregated across all steps.
 *
 * @param steps - Array of step results from measureStepWithLongTasks
 * @returns TimerResult array to merge into benchmark run results
 */
export function buildLongTaskTimerResults(
  steps: LongTaskStepResult[],
): TimerResult[] {
  const results: TimerResult[] = [];

  let totalCount = 0;
  let totalDuration = 0;
  let maxDuration = 0;
  let totalTbt = 0;

  for (const step of steps) {
    results.push({ id: `${step.id}.longTaskCount`, duration: step.longTaskCount });

    totalCount += step.longTaskCount;
    totalDuration += step.longTaskTotalDuration;
    maxDuration = Math.max(maxDuration, step.longTaskMaxDuration);
    totalTbt += step.tbt;
  }

  results.push(
    { id: 'longTaskCount', duration: totalCount },
    { id: 'longTaskTotalDuration', duration: totalDuration },
    { id: 'longTaskMaxDuration', duration: maxDuration },
    { id: 'tbt', duration: totalTbt },
  );

  return results;
}
