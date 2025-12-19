#!/usr/bin/env tsx
/**
 * Sends benchmark results to Sentry. Called by CI after benchmark.ts completes.
 *
 * Reads JSON from --results and sends metrics as Sentry structured logs with
 * attributes for filtering (ci.browser, ci.buildType, ci.persona, etc.).
 *
 * Requires SENTRY_DSN_PERFORMANCE env var. Skips silently if not set.
 */

import { execSync } from 'child_process';
import { promises as fs } from 'fs';
import * as Sentry from '@sentry/node';
import { hideBin } from 'yargs/helpers';
import yargs from 'yargs/yargs';
import type { BenchmarkResults } from './types-generated';

/** Gets current git commit hash, or 'unknown' if unavailable. */
function getGitCommitHash(): string {
  try {
    return execSync('git rev-parse HEAD', { encoding: 'utf-8' }).trim();
  } catch {
    return 'unknown';
  }
}

/** Gets current git branch name, or 'local' if unavailable. */
function getGitBranch(): string {
  try {
    return execSync('git branch --show-current', { encoding: 'utf-8' }).trim();
  } catch {
    return 'local';
  }
}

/**
 * Type guard for standard benchmark results (has mean/min/max/etc).
 *
 * @param value - The value to check.
 */
function isStandardBenchmarkResult(value: unknown): value is BenchmarkResults {
  return (
    typeof value === 'object' &&
    value !== null &&
    'mean' in value &&
    typeof (value as BenchmarkResults).mean === 'object'
  );
}

/** User action result with testTitle, persona and numeric timing metrics. */
type UserActionResult = {
  testTitle: string;
  persona?: string;
  [key: string]: string | number | undefined;
};

/**
 * Type guard for user action results (has testTitle and at least one numeric metric).
 *
 * @param value - The value to check.
 */
function isUserActionResult(value: unknown): value is UserActionResult {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const obj = value as Record<string, unknown>;
  // Must have testTitle
  if (typeof obj.testTitle !== 'string') {
    return false;
  }
  // Must have at least one numeric metric
  return Object.values(obj).some((v) => typeof v === 'number');
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
    enableLogs: true,
  });

  // CI metadata as flat attributes (persona comes from each result's JSON)
  const baseCiAttributes = {
    'ci.branch': process.env.GITHUB_REF_NAME || getGitBranch(),
    'ci.prNumber': process.env.PR_NUMBER || 'none',
    'ci.commitHash': process.env.HEAD_COMMIT_HASH || getGitCommitHash(),
    'ci.job': process.env.GITHUB_JOB || 'local',
    'ci.browser': argv.browser,
    'ci.buildType': argv.buildType,
    'ci.pageType': argv.pageType,
  };

  // Helper to flatten an object with a prefix (e.g., 'benchmark.mean')
  const flatten = (obj: Record<string, number> | undefined, prefix: string) =>
    Object.entries(obj || {}).reduce(
      (acc, [key, val]) => ({ ...acc, [`${prefix}.${key}`]: val }),
      {} as Record<string, number>,
    );

  for (const [name, value] of Object.entries(results)) {
    if (isStandardBenchmarkResult(value)) {
      // Flatten benchmark metrics with prefixes for queryability
      const benchmarkAttributes = {
        ...flatten(value.mean, 'benchmark.mean'),
        ...flatten(value.p75, 'benchmark.p75'),
        ...flatten(value.p95, 'benchmark.p95'),
      };

      Sentry.logger.info(`benchmark.${name}`, {
        ...baseCiAttributes,
        'ci.persona': value.persona || 'standard',
        'ci.testTitle': value.testTitle,
        ...benchmarkAttributes,
      });
    } else if (isUserActionResult(value)) {
      // Extract numeric metrics only
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

  await Sentry.flush(10000);
  console.log(
    `✅ Successfully sent benchmark results to Sentry (${Object.keys(results).length} benchmarks)`,
  );
}

main().catch((error) => {
  console.error('❌ Failed to send benchmark results to Sentry:', error);
  process.exit(1);
});
