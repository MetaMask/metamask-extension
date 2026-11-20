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
  /**
   * The input that starts the step. It runs after the long-task and Long
   * Animation Frame windows open and before the timer starts, so the page's
   * work in response counts toward blocking metrics and not toward duration.
   */
  trigger?: () => Promise<void>;
};

/**
 * What `Driver.collectLongTaskMetrics` returns: the page's long-task metrics,
 * with its Long Animation Frame metrics as `longAnimationFrames`. Null, or a
 * missing field, where the page does not expose the hook.
 */
export type CollectedLongTaskMetrics = {
  count?: number;
  totalDuration?: number;
  maxDuration?: number;
  tbt?: number;
  observed?: boolean;
  longAnimationFrames?: {
    count: number;
    totalDuration: number;
    blockingDuration: number;
    observed: boolean;
  } | null;
} | null;

/**
 * Build a step's result from its harness-clock duration, in ms, and what
 * `Driver.collectLongTaskMetrics` returned at the end of its window.
 */
export function toLongTaskStepResult(
  id: string,
  duration: number,
  collected: CollectedLongTaskMetrics | undefined,
): LongTaskStepResult {
  const frames = collected?.longAnimationFrames;
  return {
    id,
    duration,
    longTaskCount: collected?.count ?? 0,
    longTaskTotalDuration: collected?.totalDuration ?? 0,
    longTaskMaxDuration: collected?.maxDuration ?? 0,
    tbt: collected?.tbt ?? 0,
    // `?? false` covers the hook being absent entirely; `observed` covers the
    // hook being present while `observe({ type })` was rejected. Both are
    // absences and neither is a zero.
    longTasksObserved: collected?.observed ?? false,
    longAnimationFrameCount: frames?.count ?? 0,
    longAnimationFrameTotalDuration: frames?.totalDuration ?? 0,
    longAnimationFrameBlockingDuration: frames?.blockingDuration ?? 0,
    longAnimationFramesObserved: frames?.observed ?? false,
  };
}

/**
 * Measure a benchmark step while collecting Long Task metrics delta.
 *
 * Resets long task metrics, runs the step's trigger if given, times the
 * action with TimerHelper, then collects the delta. The TimerHelper is also
 * registered with performanceTracker for report generation.
 *
 * @param driver - Selenium driver instance
 * @param stepId - Unique identifier for this step (used as timer ID)
 * @param action - Async function to measure
 * @param options - See {@link MeasureStepWithLongTasksOptions}
 * @param options.legacyTimerId - Report the timer as `<stepId>Legacy`
 * @param options.trigger - The input that starts the step, run inside the windows
 * @returns Step result with duration and long task metrics
 */
export async function measureStepWithLongTasks(
  driver: Driver,
  stepId: string,
  action: () => Promise<void>,
  { legacyTimerId = false, trigger }: MeasureStepWithLongTasksOptions = {},
): Promise<LongTaskStepResult> {
  const timer = new TimerHelper(
    legacyTimerId ? legacyStepTimerId(stepId) : stepId,
  );

  await driver.resetLongTaskMetrics();
  if (trigger) {
    await trigger();
    // A page script after the trigger waits for the main thread, so the timer
    // starts after the page's synchronous response, as it did when the reset
    // came after the trigger: step durations keep their meaning.
    await driver.executeScript('return null;');
  }

  await timer.measure(action);
  performanceTracker.addTimer(timer);

  const longTaskData = await driver.collectLongTaskMetrics();
  return toLongTaskStepResult(stepId, timer.getDuration() ?? 0, longTaskData);
}

/**
 * The per-step Long Animation Frame metric ids, named on the
 * `<stepId>Legacy` pattern of {@link legacyStepTimerId}.
 */
export function stepLongAnimationFrameIds(stepId: string) {
  return {
    count: `${stepId}LongAnimationFrameCount`,
    totalDuration: `${stepId}LongAnimationFrameTotalDuration`,
    blockingDuration: `${stepId}LongAnimationFrameBlockingDuration`,
  };
}

/**
 * Long Animation Frame metrics: run-level sums named beside the long-task
 * ones, then each step's own three. Empty when no step observed any.
 */
function buildLongAnimationFrameTimerResults(
  steps: LongTaskStepResult[],
): TimerResult[] {
  // Absent, not zero, as for the long-task metrics.
  if (!steps.some((step) => step.longAnimationFramesObserved)) {
    return [];
  }

  let totalCount = 0;
  let totalDuration = 0;
  let totalBlocking = 0;
  const perStep: TimerResult[] = [];

  for (const step of steps) {
    totalCount += step.longAnimationFrameCount;
    totalDuration += step.longAnimationFrameTotalDuration;
    totalBlocking += step.longAnimationFrameBlockingDuration;
    if (!step.longAnimationFramesObserved) {
      continue;
    }
    const ids = stepLongAnimationFrameIds(step.id);
    perStep.push(
      {
        id: ids.count,
        value: step.longAnimationFrameCount,
        unit: 'count' as const,
      },
      {
        id: ids.totalDuration,
        value: step.longAnimationFrameTotalDuration,
        unit: 'ms' as const,
      },
      {
        id: ids.blockingDuration,
        value: step.longAnimationFrameBlockingDuration,
        unit: 'ms' as const,
      },
    );
  }

  return [
    {
      id: 'longAnimationFrameCount',
      value: totalCount,
      unit: 'count' as const,
    },
    {
      id: 'longAnimationFrameTotalDuration',
      value: totalDuration,
      unit: 'ms' as const,
    },
    {
      id: 'longAnimationFrameBlockingDuration',
      value: totalBlocking,
      unit: 'ms' as const,
    },
    ...perStep,
  ];
}

/**
 * Convert step results into TimerResult[] with run-level long task totals.
 *
 * Emits `longTaskCount`, `longTaskTotalDuration`, `longTaskMaxDuration`,
 * `tbt` aggregated across all steps, then the Long Animation Frame metrics:
 * `longAnimationFrameCount`, `longAnimationFrameTotalDuration` and
 * `longAnimationFrameBlockingDuration` aggregated across all steps, and the
 * same three per step ({@link stepLongAnimationFrameIds}). Each family is
 * omitted, not zeroed, when no step observed it.
 *
 * @param steps - Array of step results from measureStepWithLongTasks
 * @returns TimerResult array to merge into benchmark run results
 */
export function buildLongTaskTimerResults(
  steps: LongTaskStepResult[],
): TimerResult[] {
  return [
    ...buildLongTaskOnlyTimerResults(steps),
    ...buildLongAnimationFrameTimerResults(steps),
  ];
}

function buildLongTaskOnlyTimerResults(
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
