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

const packageJsonPath = path.resolve(__dirname, '../../../package.json');
const { version } = JSON.parse(readFileSync(packageJsonPath, 'utf-8')) as {
  version: string;
};

const WEB_VITALS_METRICS = [
  { key: 'inp', ratingKey: 'inpRating', unit: 'millisecond' },
  { key: 'lcp', ratingKey: 'lcpRating', unit: 'millisecond' },
  { key: 'cls', ratingKey: 'clsRating', unit: 'none' },
] as const;

/**
 * Send web vitals to Sentry as spans — separate from timer-based structured logs.
 *
 * Per-run snapshots become individual spans with measurements and rating tags,
 * following the conventions from ui/helpers/utils/web-vitals.ts:
 *   - setMeasurement: benchmark.{metric} with appropriate unit
 *   - setAttribute: {metric}.rating
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
        for (const { key, ratingKey, unit } of WEB_VITALS_METRICS) {
          const value = run[key];
          const rating = run[ratingKey];

          if (value !== null) {
            span.setAttribute(`benchmark.${key}`, value);
            Sentry.setMeasurement(`benchmark.${key}`, value, unit);
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

  Sentry.init({
    dsn: SENTRY_DSN,
    enableLogs: true,
    tracesSampleRate: 1.0, // CI benchmarks: capture all spans
    release: `metamask-extension@${version}`,
  });

  // CI metadata as flat attributes (persona comes from each result's JSON)
  const baseCiAttributes = {
    'ci.branch': process.env.GITHUB_REF_NAME || getGitBranch(),
    'ci.prNumber': process.env.PR_NUMBER || 'none',
    'ci.commitHash': process.env.HEAD_COMMIT_HASH || getGitCommitHash(),
    'ci.job': process.env.GITHUB_JOB || 'local',
    'ci.browser': argv.browser,
    'ci.buildType': argv.buildType,
  };

  for (const [name, value] of Object.entries(results)) {
    if ('mean' in value) {
      // Standard benchmark result with statistical aggregations
      const benchmark = value as BenchmarkResults;
      const benchmarkAttributes = {
        ...mapKeys(benchmark.mean, (_, key) => `benchmark.mean.${key}`),
        ...mapKeys(benchmark.p75, (_, key) => `benchmark.p75.${key}`),
        ...mapKeys(benchmark.p95, (_, key) => `benchmark.p95.${key}`),
      };

      // Timer data: structured logs (existing path, unchanged)
      Sentry.logger.info(`benchmark.${name}`, {
        ...baseCiAttributes,
        'ci.persona': benchmark.persona || 'standard',
        'ci.testTitle': benchmark.testTitle,
        ...benchmarkAttributes,
      });

      // Web vitals: separate reporting path via spans
      if (benchmark.webVitals) {
        sendWebVitalsToSentry(
          name,
          benchmark.webVitals,
          benchmark.persona || 'standard',
          benchmark.testTitle,
          baseCiAttributes,
        );
      }
    } else {
      // User action result with numeric timing metrics
      const metrics = Object.entries(value).reduce(
        (acc, [key, val]) =>
          typeof val === 'number' ? { ...acc, [key]: val } : acc,
        {} as Record<string, number>,
      );

      Sentry.logger.info(`userAction.${name}`, {
        ...baseCiAttributes,
        'ci.persona': value.persona || 'standard',
        'ci.testTitle': value.testTitle,
        ...metrics,
      });
    }
  }

  const flushed = await Sentry.flush(10000);
  if (flushed) {
    console.log(
      `✅ Successfully sent benchmark results to Sentry (${Object.keys(results).length} benchmarks)`,
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
