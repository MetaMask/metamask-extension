import * as Sentry from '@sentry/node';
import type { BenchmarkResults } from './types-generated';

const { SENTRY_DSN_PERFORMANCE } = process.env;

/**
 * Metadata for benchmark runs to be sent as Sentry tags.
 */
export type BenchmarkMetadata = {
  /** The user persona: 'standard' or 'powerUser' */
  persona: 'standard' | 'powerUser';
  /** The browser used: 'chrome' or 'firefox' */
  browser: string;
  /** The build type: 'browserify' or 'webpack' */
  buildType: string;
};

/**
 * Initialize Sentry for the benchmark reporter.
 * Only initializes if SENTRY_DSN_PERFORMANCE is set.
 *
 * @returns true if Sentry was initialized, false otherwise
 */
export function initSentryReporter(): boolean {
  if (!SENTRY_DSN_PERFORMANCE) {
    console.log(
      'SENTRY_DSN_PERFORMANCE not set, skipping Sentry initialization',
    );
    return false;
  }

  Sentry.init({
    dsn: SENTRY_DSN_PERFORMANCE,
  });

  return true;
}

/**
 * Report benchmark metrics to Sentry.
 * Sends metrics as a Sentry event with measurements and tags.
 *
 * @param results - The benchmark results containing statistical data
 * @param metadata - Metadata about the benchmark run (persona, browser, buildType)
 */
export async function reportBenchmarkMetrics(
  results: Record<string, BenchmarkResults>,
  metadata: BenchmarkMetadata,
): Promise<void> {
  if (!SENTRY_DSN_PERFORMANCE) {
    console.log('SENTRY_DSN_PERFORMANCE not set, skipping metrics report');
    return;
  }

  for (const [pageName, pageResults] of Object.entries(results)) {
    // Set tags dynamically per benchmark
    Sentry.setTag('ci.branch', process.env.GITHUB_REF_NAME || 'local');
    Sentry.setTag('ci.prNumber', process.env.PR_NUMBER || 'none');
    Sentry.setTag('ci.commitHash', process.env.HEAD_COMMIT_HASH || 'unknown');
    Sentry.setTag('ci.job', process.env.GITHUB_JOB || 'local');
    Sentry.setTag('ci.persona', metadata.persona);
    Sentry.setTag('ci.browser', metadata.browser);
    Sentry.setTag('ci.buildType', metadata.buildType);
    Sentry.setTag('ci.testTitle', `Benchmark: ${pageName}`);
    Sentry.setTag('benchmark.name', pageName);

    Sentry.setContext('benchmark_results', {
      mean: pageResults.mean,
      min: pageResults.min,
      max: pageResults.max,
      stdDev: pageResults.stdDev,
      p75: pageResults.p75,
      p95: pageResults.p95,
    });
  }

  // Close Sentry client to force sending all pending events
  await Sentry.close(10000);
}
