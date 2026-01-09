/**
 * Benchmark runner utilities
 */

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
 * Handles the case where benchmark functions return { success: false } instead of throwing
 *
 * @param benchmarkFn - The benchmark function to execute
 * @param retries - Number of retries if the benchmark fails
 */
async function runWithRetries(
  benchmarkFn: BenchmarkFunction,
  retries: number,
): Promise<BenchmarkRunResult> {
  let lastResult: BenchmarkRunResult | null = null;
  let attempts = 0;
  const maxAttempts = retries + 1; // Initial attempt + retries

  while (attempts < maxAttempts) {
    attempts += 1;
    try {
      const result = await benchmarkFn();
      lastResult = result;

      // If successful, return immediately
      if (result.success) {
        return result;
      }

      // If failed but we have retries left, continue
      if (attempts < maxAttempts) {
        continue;
      }
    } catch (error) {
      // Unexpected error (benchmark functions should catch their own errors)
      lastResult = {
        timers: [],
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };

      // If we have retries left, continue
      if (attempts < maxAttempts) {
        continue;
      }
    }
  }

  // Return the last result (failed after all retries)
  return (
    lastResult ?? {
      timers: [],
      success: false,
      error: 'Unknown error',
    }
  );
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

    if (!exclusionCheck.passed) {
      // Mark as unreliable if too many exclusions
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
