#!/usr/bin/env tsx
/**
 * Standalone script to send benchmark results to Sentry.
 * Run this after benchmark.ts completes to send metrics.
 *
 * Supports two JSON formats:
 * 1. Standard benchmark: { pageName: { mean, min, max, stdDev, p75, p95 } }
 * 2. User actions benchmark: { actionName: number | { metric: number } }
 *
 * Persona is automatically derived from pageType:
 * - standardHome → standard
 * - powerUserHome → powerUser
 * - userActions → standard
 *
 * Usage:
 * SENTRY_DSN_PERFORMANCE=... yarn tsx test/e2e/benchmarks/send-to-sentry.ts \
 * --results test-artifacts/benchmarks/benchmark-chrome-browserify-standardHome.json \
 * --browser chrome \
 * --buildType browserify \
 * --pageType standardHome
 */

import { execSync } from 'child_process';
import { promises as fs } from 'fs';
import * as Sentry from '@sentry/node';
import { hideBin } from 'yargs/helpers';
import yargs from 'yargs/yargs';
import type { BenchmarkResults } from './types-generated';

/**
 * Get the current git commit hash.
 */
function getGitCommitHash(): string {
  try {
    return execSync('git rev-parse HEAD', { encoding: 'utf-8' }).trim();
  } catch {
    return 'unknown';
  }
}

/**
 * Get the current git branch name.
 */
function getGitBranch(): string {
  try {
    return execSync('git branch --show-current', { encoding: 'utf-8' }).trim();
  } catch {
    return 'local';
  }
}

/**
 * Check if this is a standard benchmark result (has mean/min/max/etc).
 */
function isStandardBenchmarkResult(
  value: unknown,
): value is BenchmarkResults {
  return (
    typeof value === 'object' &&
    value !== null &&
    'mean' in value &&
    typeof (value as BenchmarkResults).mean === 'object'
  );
}

/**
 * Check if this is a user actions benchmark result (number or nested object).
 */
function isUserActionResult(
  value: unknown,
): value is number | Record<string, number> {
  if (typeof value === 'number') {
    return true;
  }
  if (typeof value === 'object' && value !== null) {
    // Check if all values are numbers (nested user action like bridge)
    return Object.values(value).every((v) => typeof v === 'number');
  }
  return false;
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
    .option('pageType', {
      type: 'string',
      default: 'standardHome',
      description: 'Page type (standardHome, powerUserHome, userActions)',
    })
    .parse();

  const SENTRY_DSN = process.env.SENTRY_DSN_PERFORMANCE;

  if (!SENTRY_DSN) {
    console.log('ℹ️ SENTRY_DSN_PERFORMANCE not set, skipping Sentry upload');
    process.exit(0);
  }

  const resultsJson = await fs.readFile(argv.results, 'utf-8');
  const results: Record<string, unknown> = JSON.parse(resultsJson);

  Sentry.init({
    dsn: SENTRY_DSN,
    tracesSampleRate: 1.0,
  });

  // Derive persona from pageType
  const persona = argv.pageType === 'powerUserHome' ? 'powerUser' : 'standard';

  // Set common tags
  const setCommonTags = (testTitle: string) => {
    Sentry.setTag('ci.branch', process.env.GITHUB_REF_NAME || getGitBranch());
    Sentry.setTag('ci.prNumber', process.env.PR_NUMBER || 'none');
    Sentry.setTag(
      'ci.commitHash',
      process.env.HEAD_COMMIT_HASH || getGitCommitHash(),
    );
    Sentry.setTag('ci.job', process.env.GITHUB_JOB || 'local');
    Sentry.setTag('ci.persona', persona);
    Sentry.setTag('ci.browser', argv.browser);
    Sentry.setTag('ci.buildType', argv.buildType);
    Sentry.setTag('ci.pageType', argv.pageType);
    Sentry.setTag('ci.testTitle', testTitle);
  };

  for (const [name, value] of Object.entries(results)) {
    if (isStandardBenchmarkResult(value)) {
      // Standard benchmark format with statistical data
      setCommonTags(`Benchmark: ${name}`);

      Sentry.startSpan(
        {
          name: `benchmark.${name}`,
          op: 'benchmark',
        },
        () => {
          for (const [metricName, metricValue] of Object.entries(
            value.mean || {},
          )) {
            Sentry.setMeasurement(
              `benchmark.${metricName}`,
              metricValue,
              'millisecond',
            );
          }

          Sentry.setContext('benchmark.stats', {
            mean: value.mean || {},
            min: value.min || {},
            max: value.max || {},
            stdDev: value.stdDev || {},
            p75: value.p75 || {},
            p95: value.p95 || {},
          });
        },
      );
    } else if (isUserActionResult(value)) {
      // User actions benchmark format
      setCommonTags(`UserAction: ${name}`);

      Sentry.startSpan(
        {
          name: `userAction.${name}`,
          op: 'user-action',
        },
        () => {
          // Prefix measurements with 'userAction.' for easier querying
          if (typeof value === 'number') {
            // Simple timing: { loadNewAccount: 1234 }
            Sentry.setMeasurement('userAction.duration', value, 'millisecond');
          } else {
            // Nested timings: { bridge: { loadPage: 100, loadAssetPicker: 200 } }
            for (const [metricName, metricValue] of Object.entries(value)) {
              Sentry.setMeasurement(
                `userAction.${metricName}`,
                metricValue,
                'millisecond',
              );
            }
          }
        },
      );
    }
  }

  await Sentry.flush(10000);
  console.log(
    `✅ Successfully sent benchmark results to Sentry (${Object.keys(results).length} benchmarks)`,
  );
}

main().catch((error) => {
  console.error('❌ Failed to send benchmark results to Sentry:', error);
  process.exit(1);
});
