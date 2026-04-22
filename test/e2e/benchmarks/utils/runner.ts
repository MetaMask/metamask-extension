import get from 'lodash/get';
import { retry } from '../../../../development/lib/retry';
import type {
  BenchmarkResults,
  BenchmarkType,
  Persona,
  StatisticalResult,
  ThresholdConfig,
  TimerStatistics,
  WebVitalsAggregated,
  WebVitalsMetrics,
  WebVitalsRun,
  WebVitalsSummary,
} from '../../../../shared/constants/benchmarks';
import { BENCHMARK_PERSONA } from '../../../../shared/constants/benchmarks';
import {
  ALL_METRICS,
  DEFAULT_NUM_BROWSER_LOADS,
  DEFAULT_NUM_PAGE_LOADS,
} from './constants';
import {
  aggregateWebVitals,
  calcMaxResult,
  calcMeanResult,
  calcMinResult,
  calcPResult,
  calcStdDevResult,
  calculateTimerStatistics,
  checkExclusionRate,
  MAX_EXCLUSION_RATE,
  MAX_TOTAL_DURATION_MS,
  validateThresholds,
  WEB_VITALS_NUMERIC_KEYS,
} from './statistics';
import type {
  BenchmarkFunction,
  BenchmarkRunResult,
  BenchmarkSummary,
  MeasurePageResult,
  Metrics,
  UserActionMeasurement,
} from './types';
import { performanceTracker } from './performance-tracker';

/**
 * Promote web vitals aggregated stats into a TimerStatistics array.
 * This allows web vitals to flow through the same threshold validation
 * pipeline as traditional timers.
 *
 * @param aggregated - Aggregated web vitals from {@link aggregateWebVitals}
 */
function extractWebVitalsAsTimerStats(
  aggregated: WebVitalsAggregated,
): TimerStatistics[] {
  const stats: TimerStatistics[] = [];
  for (const key of WEB_VITALS_NUMERIC_KEYS) {
    const metric = aggregated[key];
    if (metric) {
      stats.push(metric);
    }
  }
  return stats;
}

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
  thresholdConfig: ThresholdConfig,
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

  // Aggregate timer results and collect per-run web vitals
  const timerMap = new Map<string, number[]>();
  const zeroAllowedTimers = new Set<string>();
  const webVitalsRuns: WebVitalsRun[] = [];

  for (let idx = 0; idx < allResults.length; idx++) {
    const result = allResults[idx];
    if (result.success) {
      for (const timer of result.timers) {
        if (!timerMap.has(timer.id)) {
          timerMap.set(timer.id, []);
        }
        const timerDurations = timerMap.get(timer.id);
        if (timerDurations) {
          timerDurations.push(timer.value);
        }
        if (timer.unit) {
          zeroAllowedTimers.add(timer.id);
        }
      }

      if (result.webVitals) {
        webVitalsRuns.push({ ...result.webVitals, iteration: idx });
      }
    }
  }

  const timerStats: TimerStatistics[] = [];
  let excludedDueToQuality = 0;

  for (const [timerId, durations] of timerMap) {
    const stats = calculateTimerStatistics(timerId, durations, {
      ...(zeroAllowedTimers.has(timerId) ? { minDurationMs: 0 } : {}),
    });
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

    if (exclusionCheck.passed === false && stats.dataQuality !== 'unreliable') {
      // Mark as unreliable if too many exclusions (only if not already unreliable)
      stats.dataQuality = 'unreliable';
      excludedDueToQuality += 1;
    }
  }

  // Compute per-run total durations and derive total statistics from them
  // (min/max/percentiles are not additive across timers from different runs)
  const perRunTotalDurations: number[] = [];
  for (const result of allResults) {
    if (result.success && result.timers.length > 0) {
      // Exclude long task diagnostic metrics (tagged with unit) from the
      // per-run total. They represent blocking time already captured within
      // the timed steps and would double-count if summed.
      const runTotal = result.timers
        .filter((t) => !t.unit)
        .reduce((acc, t) => acc + t.value, 0);
      perRunTotalDurations.push(runTotal);
    }
  }
  if (perRunTotalDurations.length > 0) {
    const totalStats = calculateTimerStatistics('total', perRunTotalDurations, {
      maxDurationMs: MAX_TOTAL_DURATION_MS,
    });
    timerStats.push(totalStats);
  }

  // Check overall run exclusion rate
  const overallExclusionCheck = checkExclusionRate(
    iterations,
    failedRuns,
    MAX_EXCLUSION_RATE,
  );

  // Aggregate web vitals if any runs reported them
  let webVitalsSummary: WebVitalsSummary | undefined;
  if (webVitalsRuns.length > 0) {
    const aggregated = aggregateWebVitals(webVitalsRuns);
    webVitalsSummary = { runs: webVitalsRuns, aggregated };

    // Promote web vitals into timerStats so they flow through threshold validation
    timerStats.push(...extractWebVitalsAsTimerStats(aggregated));
  }

  const thresholdResult = validateThresholds(timerStats, thresholdConfig);
  // Extract benchmarkType from the first result (same across all iterations)
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
    thresholdViolations: thresholdResult?.violations ?? [],
    thresholdsPassed: thresholdResult?.passed ?? true,
    ...(webVitalsSummary && { webVitals: webVitalsSummary }),
    benchmarkType,
  };
}

/**
 * Maps aggregated timer statistics to `BenchmarkResults` (shared with send-to-sentry and CI JSON).
 * Used by Selenium benchmarks and Playwright dapp page-load benchmarks.
 *
 * @param timers - One {@link TimerStatistics} per metric id (e.g. timer name or web vital key)
 * @param testTitle - Benchmark label written to JSON
 * @param persona - Wallet persona for this run
 * @param benchmarkType - Optional benchmark category
 * @param platform - Optional platform label
 * @param buildType - Optional build label
 * @param webVitals - Optional aggregated web vitals (from {@link BenchmarkSummary.webVitals})
 */
export function convertTimerStatisticsToBenchmarkResults(
  timers: TimerStatistics[],
  testTitle: string,
  persona: Persona = BENCHMARK_PERSONA.STANDARD,
  benchmarkType?: BenchmarkType,
  platform?: string,
  buildType?: string,
  webVitals?: WebVitalsSummary,
): BenchmarkResults {
  const mean: StatisticalResult = {};
  const min: StatisticalResult = {};
  const max: StatisticalResult = {};
  const stdDev: StatisticalResult = {};
  const p75: StatisticalResult = {};
  const p95: StatisticalResult = {};

  // timers already includes promoted web vitals from runBenchmarkWithIterations
  for (const timer of timers) {
    mean[timer.id] = timer.mean;
    min[timer.id] = timer.min;
    max[timer.id] = timer.max;
    stdDev[timer.id] = timer.stdDev;
    p75[timer.id] = timer.p75;
    p95[timer.id] = timer.p95;
  }

  return {
    testTitle,
    persona,
    benchmarkType,
    platform,
    buildType,
    mean,
    min,
    max,
    stdDev,
    p75,
    p95,
    ...(webVitals && { webVitals }),
  };
}

/**
 * Convert BenchmarkSummary (from runBenchmarkWithIterations) to BenchmarkResults format
 * for consistent output with send-to-sentry.ts
 *
 * @param summary
 * @param testTitle
 * @param persona
 * @param benchmarkType
 * @param platform
 * @param buildType
 */
export function convertSummaryToResults(
  summary: BenchmarkSummary,
  testTitle: string,
  persona: Persona = BENCHMARK_PERSONA.STANDARD,
  benchmarkType?: BenchmarkType,
  platform?: string,
  buildType?: string,
): BenchmarkResults {
  return convertTimerStatisticsToBenchmarkResults(
    summary.timers,
    testTitle,
    persona,
    benchmarkType,
    platform,
    buildType,
    summary.webVitals,
  );
}

export async function runPageLoadBenchmark(
  measurePageFn: (
    pageName: string,
    pageLoads: number,
  ) => Promise<MeasurePageResult>,
  options: {
    browserLoads?: number;
    pageLoads?: number;
    retries?: number;
    platform?: string;
    buildType?: string;
  },
): Promise<BenchmarkResults> {
  const {
    browserLoads = DEFAULT_NUM_BROWSER_LOADS,
    pageLoads = DEFAULT_NUM_PAGE_LOADS,
    retries = 0,
    platform,
    buildType,
  } = options;

  const pageName = 'home';
  let runResults: Metrics[] = [];
  let allWebVitalsRuns: WebVitalsRun[] = [];
  let testTitle = '';
  let resultPersona: Persona = BENCHMARK_PERSONA.STANDARD;

  for (let i = 0; i < browserLoads; i += 1) {
    console.log('Starting browser load', i + 1, 'of', browserLoads);
    const { metrics, title, persona, webVitalsRuns } = await retry(
      { retries },
      () => measurePageFn(pageName, pageLoads),
    );
    runResults = runResults.concat(metrics);
    if (webVitalsRuns) {
      const indexed = webVitalsRuns.map((wv: WebVitalsMetrics, j: number) => ({
        ...wv,
        iteration: i * pageLoads + j,
      }));
      allWebVitalsRuns = allWebVitalsRuns.concat(indexed);
    }
    testTitle = title;
    resultPersona = persona;
  }

  if (runResults.some((result) => result.navigation.length > 1)) {
    throw new Error(`Multiple navigations not supported`);
  }
  const firstNonNavigate = runResults.find(
    (result) => result.navigation[0].type !== 'navigate',
  );
  if (firstNonNavigate !== undefined) {
    throw new Error(
      `Navigation type ${firstNonNavigate.navigation[0].type} not supported`,
    );
  }

  const result: Record<string, number[]> = {};
  for (const [key, tracePath] of Object.entries(ALL_METRICS)) {
    result[key] = runResults
      .map((m) => get(m, tracePath) as number)
      .sort((a, b) => a - b);
  }

  let webVitals: WebVitalsSummary | undefined;
  if (allWebVitalsRuns.length > 0) {
    webVitals = {
      runs: allWebVitalsRuns,
      aggregated: aggregateWebVitals(allWebVitalsRuns),
    };
  }

  const mean = calcMeanResult(result);
  const min = calcMinResult(result);
  const max = calcMaxResult(result);
  const stdDevResult = calcStdDevResult(result);
  const p75 = calcPResult(result, 75);
  const p95 = calcPResult(result, 95);

  // Promote web vitals aggregated stats into the top-level maps
  if (webVitals?.aggregated) {
    for (const wv of extractWebVitalsAsTimerStats(webVitals.aggregated)) {
      mean[wv.id] = wv.mean;
      min[wv.id] = wv.min;
      max[wv.id] = wv.max;
      stdDevResult[wv.id] = wv.stdDev;
      p75[wv.id] = wv.p75;
      p95[wv.id] = wv.p95;
    }
  }

  return {
    testTitle,
    persona: resultPersona,
    platform,
    buildType,
    mean,
    min,
    max,
    stdDev: stdDevResult,
    p75,
    p95,
    ...(webVitals && { webVitals }),
  };
}

export async function runUserActionBenchmark(
  measureFn: () => Promise<UserActionMeasurement>,
  benchmarkType?: BenchmarkType,
): Promise<BenchmarkRunResult> {
  try {
    const { timers, webVitals } = await measureFn();
    return { timers, webVitals, success: true, benchmarkType };
  } catch (error) {
    return {
      timers: [],
      success: false,
      error: error instanceof Error ? error.message : String(error),
      benchmarkType,
    };
  }
}
