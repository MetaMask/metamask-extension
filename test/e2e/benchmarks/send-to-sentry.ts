#!/usr/bin/env tsx
/**
 * Sends benchmark results to Sentry. Called by CI after benchmark.ts completes.
 *
 * Reads JSON from --results and sends metrics as Sentry structured logs with
 * attributes for filtering (ci.browser, ci.buildType, ci.persona, etc.).
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
import { BENCHMARK_PERSONA, BENCHMARK_TYPE } from './utils/constants';
import type { BenchmarkResults, UserActionResult } from './utils/types';

const packageJsonPath = path.resolve(__dirname, '../../../package.json');
const { version } = JSON.parse(readFileSync(packageJsonPath, 'utf-8')) as {
  version: string;
};

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

  // Soft-fail if results have no valid metric data
  const hasValidData = Object.values(results).some((value) => {
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
      `⚠️ No valid benchmark data to send to Sentry. File: ${argv.results}`,
    );
    return;
  }

  Sentry.init({
    dsn: SENTRY_DSN,
    enableLogs: true,
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

      Sentry.logger.info(message, {
        ...baseCiAttributes,
        'ci.persona': benchmark.persona || BENCHMARK_PERSONA.STANDARD,
        'ci.testTitle': benchmark.testTitle,
        ...allMetrics,
      });
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
