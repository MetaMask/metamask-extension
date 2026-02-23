#!/usr/bin/env tsx
/**
 * Sends benchmark results to Sentry. Called by CI after benchmark.ts completes.
 *
 * Reads JSON from --results and sends metrics as Sentry structured logs with
 * attributes for filtering (ci.browser, ci.buildType, ci.persona, etc.).
 *
 * Timer-based benchmark data goes through structured logs (existing path).
 * Web vitals data goes through spans with measurements (separate path),
 * following conventions from ui/helpers/utils/web-vitals.ts.
 *
 * Requires SENTRY_DSN_PERFORMANCE env var. Throws if not set.
 */

import { promises as fs, readFileSync } from 'fs';
import path from 'path';
import mapKeys from 'lodash/mapKeys';
import * as Sentry from '@sentry/node';
import { hideBin } from 'yargs/helpers';
import yargs from 'yargs/yargs';
import { getGitBranch, getGitCommitHash } from './send-to-sentry-utils';
import type {
  BenchmarkResults,
  UserActionResult,
  WebVitalsSummary,
} from './utils/types';
import { BENCHMARK_PERSONA, BENCHMARK_TYPE } from './utils/constants';

const packageJsonPath = path.resolve(__dirname, '../../../package.json');
const { version } = JSON.parse(readFileSync(packageJsonPath, 'utf-8')) as {
  version: string;
};

const WEB_VITALS_METRICS = [
  { key: 'inp', ratingKey: 'inpRating' },
  { key: 'lcp', ratingKey: 'lcpRating' },
  { key: 'cls', ratingKey: 'clsRating' },
] as const;

/**
 * Send web vitals to Sentry as spans — separate from timer-based structured logs.
 *
 * Per-run snapshots become individual spans with rating tags,
 * following the conventions from ui/helpers/utils/web-vitals.ts:
 * - setAttribute: benchmark.{metric} (numeric value)
 * - setAttribute: {metric}.rating
 *
 * Aggregated summary goes as a structured log for dashboards.
 *
 * @param benchmarkName - The benchmark identifier (e.g. 'loadNewAccount')
 * @param webVitals - Full web vitals summary with per-run data and aggregates
 * @param persona - The persona used for the benchmark
 * @param testTitle - The test title
 * @param ciAttributes - CI metadata attributes
 */
function sendWebVitalsToSentry(
  benchmarkName: string,
  webVitals: WebVitalsSummary,
  persona: string,
  testTitle: string | undefined,
  ciAttributes: Record<string, string>,
): void {
  // Per-run spans: each iteration gets its own span with measurements
  for (const run of webVitals.runs) {
    Sentry.startSpan(
      {
        name: `benchmark.${benchmarkName}.webVitals`,
        op: 'benchmark.webvitals',
        attributes: {
          ...ciAttributes,
          'ci.persona': persona,
          'ci.testTitle': testTitle ?? benchmarkName,
          'webVitals.iteration': run.iteration,
        },
      },
      (span) => {
        for (const { key, ratingKey } of WEB_VITALS_METRICS) {
          const value = run[key];
          const rating = run[ratingKey];

          if (value !== null) {
            span.setAttribute(`benchmark.${key}`, value);
          }

          if (rating !== null) {
            span.setAttribute(`${key}.rating`, rating);
          }
        }
      },
    );
  }

  // Aggregated summary as a structured log for dashboards
  const { aggregated } = webVitals;
  const aggAttributes: Record<string, number | string> = {
    'webVitals.runs': webVitals.runs.length,
  };

  for (const { key } of WEB_VITALS_METRICS) {
    const stats = aggregated[key as keyof typeof aggregated];
    if (stats && typeof stats === 'object' && 'mean' in stats) {
      aggAttributes[`webVitals.${key}.mean`] = stats.mean;
      aggAttributes[`webVitals.${key}.p75`] = stats.p75;
      aggAttributes[`webVitals.${key}.p95`] = stats.p95;
      aggAttributes[`webVitals.${key}.samples`] = stats.samples;
      aggAttributes[`webVitals.${key}.dataQuality`] = stats.dataQuality;
    }

    const ratings = aggregated.ratings[key as keyof typeof aggregated.ratings];
    aggAttributes[`webVitals.${key}.ratings.good`] = ratings.good;
    aggAttributes[`webVitals.${key}.ratings.needsImprovement`] =
      ratings['needs-improvement'];
    aggAttributes[`webVitals.${key}.ratings.poor`] = ratings.poor;
  }

  Sentry.logger.info(`benchmark.${benchmarkName}.webVitals.summary`, {
    ...ciAttributes,
    'ci.persona': persona,
    'ci.testTitle': testTitle ?? benchmarkName,
    ...aggAttributes,
  });
}

async function main() {
  const argv = await yargs(hideBin(process.argv))
    .option('results', {
      type: 'string',
      demandOption: true,
      description: 'Path to benchmark results JSON file',
    })
    .option('browser', {
      type: 'string',
      default: 'chrome',
      description: 'Browser used (chrome or firefox)',
    })
    .option('buildType', {
      type: 'string',
      default: 'browserify',
      description: 'Build type (browserify or webpack)',
    })
    .parse();

  const SENTRY_DSN = process.env.SENTRY_DSN_PERFORMANCE;

  if (!SENTRY_DSN) {
    throw new Error(
      'SENTRY_DSN_PERFORMANCE env var is required. Use workflow `if:` condition to skip this step when not needed.',
    );
  }

  const resultsJson = await fs.readFile(argv.results, 'utf-8');
  const results = JSON.parse(resultsJson) as Record<
    string,
    BenchmarkResults | UserActionResult
  >;

  // Check if results are empty
  const resultEntries = Object.entries(results);
  if (resultEntries.length === 0) {
    console.warn(
      '⚠️ ALERT: Benchmark results file is empty, no results will be sent to Sentry',
    );
    console.warn(`   File: ${argv.results}`);
    return;
  }

  // Check if all results have empty data
  const hasValidData = resultEntries.some(([, value]) => {
    if ('mean' in value) {
      // BenchmarkResults - check if mean has any metrics
      const benchmark = value as BenchmarkResults;
      return benchmark.mean && Object.keys(benchmark.mean).length > 0;
    }
    // UserActionResult - check if there are any numeric metrics
    return Object.values(value).some((v) => typeof v === 'number');
  });

  if (!hasValidData) {
    console.warn(
      '⚠️ ALERT: All benchmark results are empty, no metrics will be sent to Sentry',
    );
    console.warn(`   File: ${argv.results}`);
    console.warn('   Results:', JSON.stringify(results, null, 2));
    return;
  }

  Sentry.init({
    dsn: SENTRY_DSN,
    enableLogs: true,
    tracesSampleRate: 1.0, // CI benchmarks: capture all spans
    release: `metamask-extension@${version}`,
  });

  // CI metadata
  const baseCiAttributes = {
    'ci.branch': process.env.GITHUB_REF_NAME || getGitBranch(),
    'ci.prNumber': process.env.PR_NUMBER || 'none',
    'ci.commitHash': process.env.HEAD_COMMIT_HASH || getGitCommitHash(),
    'ci.browser': argv.browser,
    'ci.buildType': argv.buildType,
  };

  let sentCount = 0;
  let skippedCount = 0;

  for (const [name, value] of Object.entries(results)) {
    if ('mean' in value) {
      // Statistical benchmark result (page load or performance)
      const benchmark = value as BenchmarkResults;
      const type = benchmark.benchmarkType || BENCHMARK_TYPE.BENCHMARK;
      const message = `${type}.${name}`;

      // Skip if mean is empty
      if (Object.keys(benchmark.mean).length === 0) {
        console.warn(`⚠️ Skipping empty benchmark result: ${name}`);
        skippedCount += 1;
        continue;
      }

      const allMetrics: Record<string, number> = {};
      const statTypes = ['mean', 'p75', 'p95'] as const;
      for (const statType of statTypes) {
        const statData = benchmark[statType];
        if (statData && Object.keys(statData).length > 0) {
          Object.assign(
            allMetrics,
            mapKeys(statData, (_, key) => `${type}.${statType}.${key}`),
          );
        }
      }

      // Timer data: structured logs (existing path, unchanged)
      Sentry.logger.info(message, {
        ...baseCiAttributes,
        'ci.persona': benchmark.persona || BENCHMARK_PERSONA.STANDARD,
        'ci.testTitle': benchmark.testTitle,
        ...allMetrics,
      });

      // Web vitals: separate reporting path via spans
      if (benchmark.webVitals) {
        sendWebVitalsToSentry(
          name,
          benchmark.webVitals,
          benchmark.persona || BENCHMARK_PERSONA.STANDARD,
          benchmark.testTitle,
          baseCiAttributes,
        );
      }
      sentCount += 1;
    } else {
      // User action result with numeric timing metrics
      const userAction = value as UserActionResult;
      const type = userAction.benchmarkType || BENCHMARK_TYPE.USER_ACTION;
      const message = `${type}.${name}`;

      const metrics = Object.entries(userAction).reduce(
        (acc, [key, val]) =>
          typeof val === 'number' ? { ...acc, [key]: val } : acc,
        {} as Record<string, number>,
      );

      // Skip if no numeric metrics
      if (Object.keys(metrics).length === 0) {
        console.warn(`⚠️ Skipping empty user action result: ${name}`);
        skippedCount += 1;
        continue;
      }

      Sentry.logger.info(message, {
        ...baseCiAttributes,
        'ci.persona': userAction.persona || BENCHMARK_PERSONA.STANDARD,
        'ci.testTitle': userAction.testTitle,
        ...metrics,
      });
      sentCount += 1;
    }
  }

  if (skippedCount > 0) {
    console.warn(`⚠️ ALERT: Skipped ${skippedCount} empty benchmark result(s)`);
  }

  if (sentCount === 0) {
    console.warn('⚠️ ALERT: No valid benchmark results to send to Sentry');
    return;
  }

  const flushed = await Sentry.flush(10000);
  if (flushed) {
    console.log(
      `✅ Successfully sent benchmark results to Sentry (${sentCount} benchmarks)`,
    );
  } else {
    console.warn(
      `⚠️ Sentry flush timed out - some benchmark results may not have been sent`,
    );
  }
}

main().catch((error) => {
  console.error('❌ Failed to send benchmark results to Sentry:', error);
  process.exit(1);
});
