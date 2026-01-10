#!/usr/bin/env tsx
/**
 * Sends benchmark results to Sentry. Called by CI after benchmark.ts completes.
 *
 * Reads JSON from --results and sends metrics as Sentry structured logs with
 * attributes for filtering (ci.browser, ci.buildType, ci.persona, etc.).
 *
 * Requires SENTRY_DSN_PERFORMANCE env var. Throws if not set.
 */

import { promises as fs } from 'fs';
import { createRequire } from 'module';
import mapKeys from 'lodash/mapKeys';
import * as Sentry from '@sentry/node';
import { hideBin } from 'yargs/helpers';
import yargs from 'yargs/yargs';
import { getGitBranch, getGitCommitHash } from './send-to-sentry-utils';
import type { BenchmarkResults, UserActionResult } from './types-generated';

const require = createRequire(import.meta.url);
const { version } = require('../../../package.json') as { version: string };

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

      Sentry.logger.info(`benchmark.${name}`, {
        ...baseCiAttributes,
        'ci.persona': benchmark.persona || 'standard',
        'ci.testTitle': benchmark.testTitle,
        ...benchmarkAttributes,
      });
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
