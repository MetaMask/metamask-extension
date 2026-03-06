/**
 * Performance observers for production and benchmark instrumentation.
 *
 * Long Task observer detects main thread blocking (>50ms). Total Blocking
 * Time (TBT) is derived as the sum of (duration - 50ms) for each task.
 *
 * `PerformanceObserver` for `longtask` entries IS supported on
 * `chrome-extension://` pages, unlike paint-based metrics (LCP, FCP).
 * This makes Long Task / TBT the primary production performance signal
 * for browser extensions.
 *
 * @see https://web.dev/articles/long-tasks-devtools
 * @see https://developer.chrome.com/docs/lighthouse/performance/lighthouse-total-blocking-time
 */

/**
 * Entry from PerformanceObserver for longtask entries.
 */
type LongTaskEntry = {
  name: string;
  duration: number;
  startTime: number;
};

/**
 * Accumulated metrics for Long Tasks.
 */
export type LongTaskMetrics = {
  /** Total count of long tasks observed */
  count: number;
  /** Sum of all long task durations in milliseconds */
  totalDuration: number;
  /** Maximum single long task duration in milliseconds */
  maxDuration: number;
  /** Individual task entries (capped at 50) */
  tasks: LongTaskEntry[];
};

/**
 * Extended metrics including derived TBT.
 */
export type LongTaskMetricsWithTBT = LongTaskMetrics & {
  /** Total Blocking Time in milliseconds */
  tbt: number;
  /** TBT rating based on Lighthouse thresholds */
  tbtRating: 'good' | 'needs-improvement' | 'poor';
};

/** Maximum number of individual tasks to store */
const MAX_TASKS_STORED = 50;

/** Long task threshold in milliseconds */
const LONG_TASK_THRESHOLD_MS = 50;

/** TBT threshold for "good" rating in milliseconds */
const TBT_GOOD_THRESHOLD_MS = 200;

/** TBT threshold for "needs improvement" rating in milliseconds */
const TBT_NEEDS_IMPROVEMENT_THRESHOLD_MS = 600;

let longTaskMetrics: LongTaskMetrics = {
  count: 0,
  totalDuration: 0,
  maxDuration: 0,
  tasks: [],
};

let observer: PerformanceObserver | null = null;

/**
 * Set up Long Task observer for main thread blocking detection.
 * Long tasks are any JS execution >50ms that blocks user interaction.
 *
 * @param sampleRate - Percentage of sessions to track (0-1, default 0.1 = 10%)
 * @returns Cleanup function to disconnect the observer
 */
export function setupLongTaskObserver(sampleRate: number = 0.1): () => void {
  if (Math.random() > sampleRate) { // NOSONAR: intentional — performance sampling, not security
    return () => {
      // No-op cleanup for non-sampled sessions
    };
  }

  if (!('PerformanceObserver' in globalThis)) {
    // Silent no-op in non-browser environments (Node/Jest)
    return () => {
      // No-op cleanup
    };
  }

  // Prevent duplicate observers
  if (observer) {
    return () => {
      disconnectLongTaskObserver();
    };
  }

  try {
    observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        longTaskMetrics.count += 1;
        longTaskMetrics.totalDuration += entry.duration;
        longTaskMetrics.maxDuration = Math.max(
          longTaskMetrics.maxDuration,
          entry.duration,
        );

        // Store up to MAX_TASKS_STORED tasks for analysis
        if (longTaskMetrics.tasks.length < MAX_TASKS_STORED) {
          longTaskMetrics.tasks.push({
            name: entry.name,
            duration: entry.duration,
            startTime: entry.startTime,
          });
        }
      }
    });

    observer.observe({ type: 'longtask', buffered: true });
  } catch (error) {
    // Reset observer to allow future retry attempts
    observer = null;
    console.warn('[Performance] Failed to setup Long Task observer:', error);
  }

  return () => {
    disconnectLongTaskObserver();
  };
}

/**
 * Disconnect the Long Task observer.
 */
export function disconnectLongTaskObserver(): void {
  if (observer) {
    observer.disconnect();
    observer = null;
  }
}

/**
 * Get current Long Task metrics.
 *
 * @param reset - If true, resets the metrics after retrieval
 * @returns Current long task metrics
 */
export function getLongTaskMetrics(reset: boolean = false): LongTaskMetrics {
  const result = { ...longTaskMetrics, tasks: [...longTaskMetrics.tasks] };

  if (reset) {
    resetLongTaskMetrics();
  }

  return result;
}

/**
 * Reset Long Task metrics to initial state.
 */
export function resetLongTaskMetrics(): void {
  longTaskMetrics = {
    count: 0,
    totalDuration: 0,
    maxDuration: 0,
    tasks: [],
  };
}

/**
 * Calculate Total Blocking Time (TBT) from Long Tasks.
 * TBT = sum of (duration - 50ms) for all long tasks.
 *
 * @param tasks - Array of task objects with duration property
 * @returns Total Blocking Time in milliseconds
 */
export function calculateTBT(tasks: { duration: number }[]): number {
  return tasks.reduce(
    (total, task) =>
      total + Math.max(0, task.duration - LONG_TASK_THRESHOLD_MS),
    0,
  );
}

/**
 * Get TBT rating based on Lighthouse thresholds.
 *
 * @param tbt - Total Blocking Time in milliseconds
 * @returns Rating: 'good' (<200ms), 'needs-improvement' (200-600ms), or 'poor' (>600ms)
 * @see https://developer.chrome.com/docs/lighthouse/performance/lighthouse-total-blocking-time/#what-is-a-good-tbt-score
 */
export function getTBTRating(
  tbt: number,
): 'good' | 'needs-improvement' | 'poor' {
  if (tbt < TBT_GOOD_THRESHOLD_MS) {
    return 'good';
  }
  if (tbt < TBT_NEEDS_IMPROVEMENT_THRESHOLD_MS) {
    return 'needs-improvement';
  }
  return 'poor';
}

/**
 * Get Long Task metrics with derived TBT.
 *
 * @param reset - If true, resets the metrics after retrieval
 * @returns Metrics including TBT value and rating
 */
export function getLongTaskMetricsWithTBT(
  reset: boolean = false,
): LongTaskMetricsWithTBT {
  const metrics = getLongTaskMetrics(reset);
  const tbt = calculateTBT(metrics.tasks);

  return {
    ...metrics,
    tbt,
    tbtRating: getTBTRating(tbt),
  };
}

/**
 * Report Long Task metrics to Sentry.
 * Attaches measurements to the current active transaction.
 *
 * On `chrome-extension://` pages, `setMeasurement` only works if there
 * is an active span. Production pageload transactions from
 * `browserTracingIntegration` may have already closed by the time
 * enough long tasks accumulate. Consider calling this during
 * `visibilitychange` when the popup is being hidden.
 *
 * @param metrics - Metrics to report (uses current metrics if not provided)
 */
export function reportLongTaskMetricsToSentry(
  metrics?: LongTaskMetricsWithTBT,
): void {
  const metricsToReport = metrics ?? getLongTaskMetricsWithTBT();
  const { sentry } = globalThis;

  if (!sentry) {
    return;
  }

  // Set measurements for Sentry traces
  sentry.setMeasurement?.('long_task_count', metricsToReport.count, 'none');
  sentry.setMeasurement?.(
    'long_task_total_ms',
    metricsToReport.totalDuration,
    'millisecond',
  );
  sentry.setMeasurement?.(
    'long_task_max_ms',
    metricsToReport.maxDuration,
    'millisecond',
  );
  sentry.setMeasurement?.('tbt', metricsToReport.tbt, 'millisecond');

  // Set tags for filtering in Sentry
  sentry.setTag?.('tbt.rating', metricsToReport.tbtRating);
  sentry.setTag?.(
    'long_task.count_bucket',
    bucketizeCount(metricsToReport.count),
  );

  // Add breadcrumb for debugging
  sentry.addBreadcrumb?.({
    category: 'performance',
    message: `Long tasks: ${metricsToReport.count}, TBT: ${metricsToReport.tbt}ms (${metricsToReport.tbtRating})`,
    level: 'info',
    data: {
      topTasks: metricsToReport.tasks.slice(0, 5),
    },
  });
}

/**
 * Bucketize count for Sentry tag filtering.
 *
 * @param count - The count value to bucketize
 * @returns A string representing the bucket range
 */
function bucketizeCount(count: number): string {
  if (count === 0) {
    return '0';
  }
  if (count <= 5) {
    return '1-5';
  }
  if (count <= 10) {
    return '6-10';
  }
  if (count <= 25) {
    return '11-25';
  }
  if (count <= 50) {
    return '26-50';
  }
  return '50+';
}

/**
 * Wire `visibilitychange` to report TBT + long task aggregates to Sentry.
 *
 * Extension popups fire `visibilitychange → hidden` when the user clicks
 * away. This is the most reliable "end of session" signal for
 * `chrome-extension://` pages and is typically the last moment an active
 * span still exists (Sentry's `browserTracingIntegration` creates one
 * `ui.long-task` child span per task; our aggregate measurements attach
 * to the root pageload/navigation span).
 *
 * @returns Cleanup function to remove the listener
 */
export function setupLongTaskSentryReporting(): () => void {
  if (typeof document === 'undefined') {
    return () => {
      // No-op in non-browser environments
    };
  }

  const onVisibilityChange = (): void => {
    if (document.visibilityState === 'hidden') {
      reportLongTaskMetricsToSentry();
    }
  };

  document.addEventListener('visibilitychange', onVisibilityChange);

  return () => {
    document.removeEventListener('visibilitychange', onVisibilityChange);
  };
}

/**
 * Expose Long Task metrics on stateHooks for E2E testing.
 * Call this from ui/index.js after stateHooks is initialized.
 */
export function exposeLongTaskMetricsForTesting(): void {
  if (
    (process.env.IN_TEST || process.env.METAMASK_DEBUG) &&
    globalThis.stateHooks
  ) {
    globalThis.stateHooks.getLongTaskMetrics = getLongTaskMetrics;
    globalThis.stateHooks.getLongTaskMetricsWithTBT = getLongTaskMetricsWithTBT;
    globalThis.stateHooks.resetLongTaskMetrics = resetLongTaskMetrics;
  }
}
