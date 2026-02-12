import get from 'lodash/get';
import { retry } from '../../../../development/lib/retry';
import {
  ALL_METRICS,
  DEFAULT_NUM_BROWSER_LOADS,
  DEFAULT_NUM_PAGE_LOADS,
} from './constants';
import {
  calcMaxResult,
  calcMeanResult,
  calcMinResult,
  calcPResult,
  calcStdDevResult,
  calculateTimerStatistics,
  checkExclusionRate,
  MAX_EXCLUSION_RATE,
  validateThresholds,
} from './statistics';
import type {
  BenchmarkFunction,
  BenchmarkResults,
  BenchmarkRunResult,
  BenchmarkSummary,
  BenchmarkType,
  Metrics,
  ThresholdConfig,
  TimerResult,
  TimerStatistics,
} from './types';
import { performanceTracker } from './performance-tracker';

/**
 * Run a benchmark function with retries
 * Wraps the shared retry utility to handle benchmark functions that return
 * { success: false } instead of throwing errors.
 *
 * @param benchmarkFn - The benchmark function to execute
 * @param retries - Number of retries if the benchmark fails
 */
async function runWithRetries(
  benchmarkFn: BenchmarkFunction,
  retries: number,
): Promise<BenchmarkRunResult> {
  let lastResult: BenchmarkRunResult = {
    timers: [],
    success: false,
    error: 'Unknown error',
  };

  try {
    return await retry({ retries, delay: 1000 }, async () => {
      performanceTracker.reset();

      const result = await benchmarkFn();
      lastResult = result;

      if (!result.success) {
        throw new Error(result.error ?? 'Benchmark failed');
      }
      return result;
    });
  } catch {
    return lastResult;
  }
}

export async function runBenchmarkWithIterations(
  name: string,
  benchmarkFn: BenchmarkFunction,
  iterations: number,
  retries: number,
  thresholdConfig?: ThresholdConfig,
): Promise<BenchmarkSummary> {
  const allResults: BenchmarkRunResult[] = [];
  let successfulRuns = 0;
  let failedRuns = 0;

  for (let i = 0; i < iterations; i++) {
    const result = await runWithRetries(benchmarkFn, retries);
    allResults.push(result);

    if (result.success) {
      successfulRuns += 1;
      // Generate report after each successful run (like Mocha's afterEach)
      const timerCount = performanceTracker.getTimerCount();
      if (timerCount > 0) {
        performanceTracker.generateReport(`${name} - iteration ${i + 1}`, name);
      }
    } else {
      failedRuns += 1;
    }
  }

  // Aggregate timer results
  const timerMap = new Map<string, number[]>();
  for (const result of allResults) {
    if (result.success) {
      for (const timer of result.timers) {
        if (!timerMap.has(timer.id)) {
          timerMap.set(timer.id, []);
        }
        const timerDurations = timerMap.get(timer.id);
        if (timerDurations) {
          timerDurations.push(timer.duration);
        }
      }
    }
  }

  const timerStats: TimerStatistics[] = [];
  let excludedDueToQuality = 0;

  for (const [timerId, durations] of timerMap) {
    const stats = calculateTimerStatistics(timerId, durations);
    timerStats.push(stats);

    if (stats.dataQuality === 'unreliable') {
      excludedDueToQuality += 1;
    }

    // Check if too many samples were excluded for this timer
    const exclusionCheck = checkExclusionRate(
      durations.length,
      durations.length - stats.samples,
      MAX_EXCLUSION_RATE,
    );

    if (!exclusionCheck.passed && stats.dataQuality !== 'unreliable') {
      // Mark as unreliable if too many exclusions (only if not already unreliable)
      stats.dataQuality = 'unreliable';
      excludedDueToQuality += 1;
    }
  }

  // Check overall run exclusion rate
  const overallExclusionCheck = checkExclusionRate(
    iterations,
    failedRuns,
    MAX_EXCLUSION_RATE,
  );

  // Validate thresholds if configured
  const thresholdResult = thresholdConfig
    ? validateThresholds(timerStats, thresholdConfig)
    : undefined;

  const benchmarkType = allResults.find((r) => r.benchmarkType)?.benchmarkType;

  return {
    name,
    iterations,
    successfulRuns,
    failedRuns,
    timers: timerStats,
    timestamp: new Date().toISOString(),
    excludedDueToQuality,
    exclusionRatePassed: overallExclusionCheck.passed,
    exclusionRate: overallExclusionCheck.rate,
    ...(thresholdResult && {
      thresholdViolations: thresholdResult.violations,
      thresholdsPassed: thresholdResult.passed,
    }),
    benchmarkType,
  };
}

export type MeasurePageResult = {
  metrics: Metrics[];
  title: string;
  persona: string;
};

export async function runPageLoadBenchmark(
  measurePageFn: (
    pageName: string,
    pageLoads: number,
  ) => Promise<MeasurePageResult>,
  options: {
    browserLoads?: number;
    pageLoads?: number;
    retries?: number;
  },
): Promise<BenchmarkResults> {
  const {
    browserLoads = DEFAULT_NUM_BROWSER_LOADS,
    pageLoads = DEFAULT_NUM_PAGE_LOADS,
    retries = 0,
  } = options;

  const pageName = 'home';
  let runResults: Metrics[] = [];
  let testTitle = '';
  let resultPersona = '';

  for (let i = 0; i < browserLoads; i += 1) {
    console.log('Starting browser load', i + 1, 'of', browserLoads);
    const { metrics, title, persona } = await retry({ retries }, () =>
      measurePageFn(pageName, pageLoads),
    );
    runResults = runResults.concat(metrics);
    testTitle = title;
    resultPersona = persona;
  }

  if (runResults.some((result) => result.navigation.length > 1)) {
    throw new Error(`Multiple navigations not supported`);
  } else if (
    runResults.some((result) => result.navigation[0].type !== 'navigate')
  ) {
    throw new Error(
      `Navigation type ${
        runResults.find((result) => result.navigation[0].type !== 'navigate')
          ?.navigation[0].type
      } not supported`,
    );
  }

  const result: Record<string, number[]> = {};
  for (const [key, tracePath] of Object.entries(ALL_METRICS)) {
    result[key] = runResults
      .map((m) => get(m, tracePath) as number)
      .sort((a, b) => a - b);
  }

  return {
    testTitle,
    persona: resultPersona,
    mean: calcMeanResult(result),
    min: calcMinResult(result),
    max: calcMaxResult(result),
    stdDev: calcStdDevResult(result),
    p75: calcPResult(result, 75),
    p95: calcPResult(result, 95),
  };
}

export async function runUserActionBenchmark(
  measureFn: () => Promise<TimerResult[]>,
  benchmarkType?: BenchmarkType,
): Promise<BenchmarkRunResult> {
  try {
    const timers = await measureFn();
    return { timers, success: true, benchmarkType };
  } catch (error) {
    return {
      timers: [],
      success: false,
      error: error instanceof Error ? error.message : String(error),
      benchmarkType,
    };
  }
}
