/**
 * Unified Benchmark Runner
 *
 * Single entry point for running all benchmark types.
 * Directly imports and runs benchmark files.
 *
 */

import { spawn } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';
import { hideBin } from 'yargs/helpers';
import yargs from 'yargs/yargs';
import { exitWithError } from '../../../development/lib/exit-with-error';
import {
  getFirstParentDirectoryThatExists,
  isWritable,
} from '../../helpers/file';
import { runBenchmarkWithIterations } from './utils';
import type {
  BenchmarkResults,
  BenchmarkSummary,
  StatisticalResult,
} from './utils/types';

/**
 * Convert BenchmarkSummary (from runBenchmarkWithIterations) to BenchmarkResults format
 * for consistent output with send-to-sentry.ts
 *
 * @param summary
 * @param testTitle
 * @param persona
 */
function convertSummaryToResults(
  summary: BenchmarkSummary,
  testTitle: string,
  persona?: string,
): BenchmarkResults {
  const mean: StatisticalResult = {};
  const min: StatisticalResult = {};
  const max: StatisticalResult = {};
  const stdDev: StatisticalResult = {};
  const p75: StatisticalResult = {};
  const p95: StatisticalResult = {};

  for (const timer of summary.timers) {
    mean[timer.id] = timer.mean;
    min[timer.id] = timer.min;
    max[timer.id] = timer.max;
    stdDev[timer.id] = timer.stdDev;
    p75[timer.id] = timer.p75;
    p95[timer.id] = timer.p95;
  }

  return {
    testTitle,
    persona,
    mean,
    min,
    max,
    stdDev,
    p75,
    p95,
  };
}

/**
 * Check if a benchmark file supports iterations (performance or user-actions)
 *
 * @param filePath
 */
function supportsIterations(filePath: string): boolean {
  return (
    filePath.includes('/performance/') || filePath.includes('/user-actions/')
  );
}

const BENCHMARK_DIR = 'test/e2e/benchmarks/flows';

const PRESETS: Record<string, string[]> = {
  // Performance benchmarks
  performanceOnboarding: [
    `${BENCHMARK_DIR}/performance/onboarding-import-wallet.ts`,
    `${BENCHMARK_DIR}/performance/onboarding-new-wallet.ts`,
  ],
  performanceAssets: [
    `${BENCHMARK_DIR}/performance/asset-details.ts`,
    `${BENCHMARK_DIR}/performance/solana-asset-details.ts`,
  ],

  // Page load benchmarks
  standardHome: [`${BENCHMARK_DIR}/page-load/standard-home.ts`],
  powerUserHome: [`${BENCHMARK_DIR}/page-load/power-user-home.ts`],

  // User action benchmarks
  userActions: [
    `${BENCHMARK_DIR}/user-actions/load-new-account.ts`,
    `${BENCHMARK_DIR}/user-actions/confirm-tx.ts`,
    `${BENCHMARK_DIR}/user-actions/bridge-user-actions.ts`,
  ],

  // Playwright benchmarks
  pageLoadBenchmark: [
    'test/e2e/playwright/benchmark/page-load-benchmark.spec.ts',
  ],
};

PRESETS.all = Object.values(PRESETS).flat();

async function runBenchmarkFile(
  filePath: string,
  options: {
    iterations: number;
    retries: number;
    browserLoads: number;
    pageLoads: number;
  },
): Promise<unknown> {
  const absolutePath = path.resolve(filePath);
  const fileName = path.basename(filePath, path.extname(filePath));

  // Auto-set IS_SIDEPANEL for onboarding benchmarks
  if (fileName.includes('onboarding') && !process.env.IS_SIDEPANEL) {
    process.env.IS_SIDEPANEL = 'true';
  }

  if (filePath.includes('/playwright/')) {
    return runPlaywrightBenchmark(filePath);
  }

  const benchmark = await import(absolutePath);

  if (typeof benchmark.run !== 'function') {
    throw new Error(`No run function found in ${filePath}`);
  }

  const { run: runFn } = benchmark;

  // For benchmarks that support iterations, use runBenchmarkWithIterations to run multiple times
  if (supportsIterations(filePath) && options.iterations > 0) {
    const testTitle = benchmark.testTitle || fileName;
    const { persona } = benchmark;

    console.log(
      `Running ${fileName} with ${options.iterations} iterations (retries: ${options.retries})`,
    );

    const summary = await runBenchmarkWithIterations(
      fileName,
      runFn,
      options.iterations,
      options.retries,
    );

    console.log(
      `Completed: ${summary.successfulRuns}/${summary.iterations} successful runs`,
    );

    return convertSummaryToResults(summary, testTitle, persona);
  }

  // For other benchmarks (page-load), run once with options
  return runFn(options);
}

async function runPlaywrightBenchmark(filePath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const args = ['playwright', 'test', filePath, '--project', 'benchmark'];

    const child = spawn('yarn', args, {
      stdio: 'inherit',
      shell: true,
      cwd: process.cwd(),
    });

    child.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Playwright exited with code ${code}`));
      }
    });

    child.on('error', reject);
  });
}

async function main(): Promise<void> {
  const presetNames = Object.keys(PRESETS);

  const argv = await yargs(hideBin(process.argv))
    .usage('$0 [file] [options]', 'Run benchmarks')
    .positional('file', {
      type: 'string',
      description: 'Benchmark file path to run',
    })
    .option('preset', {
      alias: 'p',
      type: 'string',
      description: 'Preset group to run',
      choices: presetNames,
    })
    .option('iterations', {
      alias: 'i',
      default: 10,
      description:
        'Number of iterations (for performance and user-action benchmarks)',
      type: 'number',
    })
    .option('browserLoads', {
      default: 10,
      description: 'Number of browser loads (for page load benchmarks)',
      type: 'number',
    })
    .option('pageLoads', {
      default: 10,
      description:
        'Number of page loads per browser (for page load benchmarks)',
      type: 'number',
    })
    .option('retries', {
      alias: 'r',
      default: 2,
      description: 'Number of retries per benchmark run',
      type: 'number',
    })
    .option('out', {
      alias: 'o',
      description: 'Output filename. Output printed to STDOUT if omitted.',
      type: 'string',
      normalize: true,
    })
    .parseAsync();

  let filesToRun: string[] = [];
  const fileArg = argv._[0] as string | undefined;

  if (fileArg) {
    filesToRun = [fileArg];
  } else if (argv.preset) {
    filesToRun = PRESETS[argv.preset] || [];
    if (filesToRun.length === 0) {
      throw new Error(`Unknown preset: ${argv.preset}`);
    }
  } else {
    filesToRun = PRESETS.all;
  }

  const options = {
    iterations: argv.iterations,
    retries: argv.retries,
    browserLoads: argv.browserLoads,
    pageLoads: argv.pageLoads,
  };

  // Run benchmarks and collect results
  const allResults: Record<string, unknown> = {};

  for (const filePath of filesToRun) {
    const fileName = path.basename(filePath, path.extname(filePath));
    try {
      const result = await runBenchmarkFile(filePath, options);
      allResults[fileName] = result;
    } catch (error) {
      console.error(`❌ Error running ${fileName}:`, error);
      allResults[fileName] = { error: String(error) };
    }
  }

  const outputStr = JSON.stringify(allResults, null, 2);

  if (argv.out) {
    const outputDirectory = path.dirname(argv.out);
    const existingParentDirectory =
      await getFirstParentDirectoryThatExists(outputDirectory);

    if (!(await isWritable(existingParentDirectory))) {
      throw new Error('Specified output file directory is not writable');
    }

    if (outputDirectory !== existingParentDirectory) {
      await fs.mkdir(outputDirectory, { recursive: true });
    }

    await fs.writeFile(argv.out, outputStr);
  }

  console.log('\n📊 Benchmark Results:');
  console.log(outputStr);
}

main().catch((error) => {
  exitWithError(error);
});
