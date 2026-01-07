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
export function getGitCommitHash(): string {
  try {
    return execSync('git rev-parse HEAD', { encoding: 'utf-8' }).trim();
  } catch {
    return 'unknown';
  }
}

/** Gets current git branch name, or 'local' if unavailable. */
export function getGitBranch(): string {
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
export function isStandardBenchmarkResult(
  value: unknown,
): value is BenchmarkResults {
  return (
    typeof value === 'object' &&
    value !== null &&
    'mean' in value &&
    typeof (value as BenchmarkResults).mean === 'object'
  );
}

/** User action result with testTitle, persona and numeric timing metrics. */
export type UserActionResult = {
  testTitle: string;
  persona?: string;
  [key: string]: string | number | undefined;
};

/**
 * Type guard for user action results (has testTitle and at least one numeric metric).
 *
 * @param value - The value to check.
 */
export function isUserActionResult(value: unknown): value is UserActionResult {
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

/**
 * Helper to flatten an object with a prefix (e.g., 'benchmark.mean').
 *
 * @param obj - Object to flatten.
 * @param prefix - Prefix for flattened keys.
 * @returns Flattened object with prefixed keys.
 */
export const flatten = (
  obj: Record<string, number> | undefined,
  prefix: string,
): Record<string, number> =>
  Object.entries(obj || {}).reduce(
    (acc, [key, val]) => ({ ...acc, [`${prefix}.${key}`]: val }),
    {} as Record<string, number>,
  );

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
  };

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
