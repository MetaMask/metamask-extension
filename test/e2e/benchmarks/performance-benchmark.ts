/**
 * Performance Benchmark Runner
 *
 * Main entry point for running performance benchmarks.
 * Individual benchmarks are defined in separate files for maintainability.
 *
 * Usage:
 *   yarn test:e2e:benchmark:performance
 *   yarn test:e2e:benchmark:performance --benchmarks onboardingImportWallet --iterations 20
 *   yarn test:e2e:benchmark:performance --out results.json
 */
import { promises as fs } from 'fs';
import path from 'path';
import { hideBin } from 'yargs/helpers';
import yargs from 'yargs/yargs';
import { exitWithError } from '../../../development/lib/exit-with-error';
import {
  getFirstParentDirectoryThatExists,
  isWritable,
} from '../../helpers/file';

import { runAssetDetailsBenchmark } from './performance/asset-details';
import { runOnboardingImportWalletBenchmark } from './performance/onboarding-import-wallet';
import { runOnboardingNewWalletBenchmark } from './performance/onboarding-new-wallet';
import { runSolanaAssetDetailsBenchmark } from './performance/solana-asset-details';

import { runBenchmarkWithIterations } from './utils/runner';
import type {
  BenchmarkFunction,
  BenchmarkSummary,
  PerformanceBenchmarkResults,
} from './utils/types';

const BENCHMARKS: Record<string, BenchmarkFunction> = {
  onboardingImportWallet: runOnboardingImportWalletBenchmark,
  onboardingNewWallet: runOnboardingNewWalletBenchmark,
  assetDetails: runAssetDetailsBenchmark,
  solanaAssetDetails: runSolanaAssetDetailsBenchmark,
};

async function main(): Promise<PerformanceBenchmarkResults> {
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
    .parseAsync();

  const { benchmarks, iterations, out, retries } = argv as {
    benchmarks: string[];
    iterations: number;
    out?: string;
    retries: number;
  };

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

  const output: PerformanceBenchmarkResults = {
    timestamp: new Date().toISOString(),
    benchmarks: results,
  };

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
