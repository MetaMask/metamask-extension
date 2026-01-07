/**
 * Performance Benchmark Runner
 *
 * Main entry point for running performance benchmarks.
 * Individual benchmarks are defined in separate files for maintainability.
 *
 * NOTE: Performance benchmarks only run on Chrome + Browserify to reduce CI runtime.
 *
 * Usage:
 *   yarn test:e2e:benchmark:performance
 *   yarn test:e2e:benchmark:performance --benchmarks onboardingImportWallet --iterations 20
 *   yarn test:e2e:benchmark:performance --out results.json
 *   yarn test:e2e:benchmark:performance --buildType browserify
 */
import { promises as fs } from 'fs';
import path from 'path';
import { Browser } from 'selenium-webdriver';
import { hideBin } from 'yargs/helpers';
import yargs from 'yargs/yargs';
import { exitWithError } from '../../../development/lib/exit-with-error';
import {
  getFirstParentDirectoryThatExists,
  isWritable,
} from '../../helpers/file';

import {
  runAssetDetailsBenchmark,
  runOnboardingImportWalletBenchmark,
  runOnboardingNewWalletBenchmark,
  runSolanaAssetDetailsBenchmark,
} from './flows/performance';

import { runBenchmarkWithIterations } from './utils/runner';
import type {
  BenchmarkFunction,
  BenchmarkResults,
  BenchmarkSummary,
  StatisticalResult,
} from './utils/types';

/**
 * Convert performance benchmark results to page load benchmark format
 * for consistent output across all benchmark types.
 */
function convertToPageLoadFormat(
  results: BenchmarkSummary[],
): Record<string, BenchmarkResults> {
  const output: Record<string, BenchmarkResults> = {};

  for (const benchmark of results) {
    const mean: StatisticalResult = {};
    const min: StatisticalResult = {};
    const max: StatisticalResult = {};
    const stdDev: StatisticalResult = {};
    const p75: StatisticalResult = {};
    const p95: StatisticalResult = {};

    for (const timer of benchmark.timers) {
      mean[timer.id] = timer.mean;
      min[timer.id] = timer.min;
      max[timer.id] = timer.max;
      stdDev[timer.id] = timer.stdDev;
      p75[timer.id] = timer.p75;
      p95[timer.id] = timer.p95;
    }

    output[benchmark.name] = { mean, min, max, stdDev, p75, p95 };
  }

  return output;
}

const BENCHMARKS: Record<string, BenchmarkFunction> = {
  onboardingImportWallet: runOnboardingImportWalletBenchmark,
  onboardingNewWallet: runOnboardingNewWalletBenchmark,
  assetDetails: runAssetDetailsBenchmark,
  solanaAssetDetails: runSolanaAssetDetailsBenchmark,
};

async function main(): Promise<Record<string, BenchmarkResults>> {
  const argv = await yargs(hideBin(process.argv))
    .usage(
      '$0 [options]',
      'Run performance benchmarks for onboarding and login flows',
    )
    .option('benchmarks', {
      array: true,
      default: Object.keys(BENCHMARKS),
      description: 'Benchmarks to run (space-separated)',
      choices: Object.keys(BENCHMARKS),
    })
    .option('iterations', {
      default: 10,
      description: 'Number of iterations per benchmark',
      type: 'number',
    })
    .option('out', {
      description: 'Output filename. Output printed to STDOUT if omitted.',
      type: 'string',
      normalize: true,
    })
    .option('retries', {
      default: 2,
      description: 'Number of retries per benchmark run',
      type: 'number',
    })
    .option('buildType', {
      default: 'browserify',
      description: 'Build type (browserify or webpack). Performance benchmarks only run on browserify.',
      type: 'string',
      choices: ['browserify', 'webpack'],
    })
    .parseAsync();

  const { benchmarks, iterations, out, retries, buildType } = argv as {
    benchmarks: string[];
    iterations: number;
    out?: string;
    retries: number;
    buildType: string;
  };

  // Performance benchmarks only run on Chrome + Browserify
  const browser = process.env.SELENIUM_BROWSER;
  if (browser === Browser.FIREFOX) {
    console.log('⏭️  Skipping: Performance benchmarks only run on Chrome');
    return {};
  }
  if (buildType === 'webpack') {
    console.log('⏭️  Skipping: Performance benchmarks only run on browserify');
    return {};
  }

  // Validate INFURA_PROJECT_ID
  if (!process.env.INFURA_PROJECT_ID) {
    throw new Error(
      'Running performance benchmarks requires a valid process.env.INFURA_PROJECT_ID',
    );
  }

  const results: BenchmarkSummary[] = [];

  for (const benchmarkName of benchmarks) {
    const benchmarkFn = BENCHMARKS[benchmarkName];
    if (!benchmarkFn) {
      continue;
    }

    const summary = await runBenchmarkWithIterations(
      benchmarkName,
      benchmarkFn,
      iterations,
      retries,
    );
    results.push(summary);
  }

  // Convert to page load benchmark format for consistency
  const output = convertToPageLoadFormat(results);

  if (out) {
    const outputDirectory = path.dirname(out);
    const existingParentDirectory =
      await getFirstParentDirectoryThatExists(outputDirectory);

    if (!(await isWritable(existingParentDirectory))) {
      throw new Error('Specified output file directory is not writable');
    }

    if (outputDirectory !== existingParentDirectory) {
      await fs.mkdir(outputDirectory, { recursive: true });
    }

    await fs.writeFile(out, JSON.stringify(output, null, 2));
  } else {
    // Output to STDOUT when no output file is provided
    process.stdout.write(JSON.stringify(output, null, 2));
  }

  return output;
}

main().catch((error) => {
  exitWithError(error);
});
