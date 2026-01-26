import { retry } from '../../../../development/lib/retry';
import {
  calculateTimerStatistics,
  checkExclusionRate,
  MAX_EXCLUSION_RATE,
} from './statistics';
import type {
  BenchmarkFunction,
  BenchmarkRunResult,
  BenchmarkSummary,
  TimerStatistics,
} from './types';

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
): Promise<BenchmarkSummary> {
  const allResults: BenchmarkRunResult[] = [];
  let successfulRuns = 0;
  let failedRuns = 0;

  for (let i = 0; i < iterations; i++) {
    const result = await runWithRetries(benchmarkFn, retries);
    allResults.push(result);

    if (result.success) {
      successfulRuns += 1;
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

  // Calculate statistics for each timer
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
  };
}
