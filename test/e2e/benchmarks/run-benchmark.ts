/**
 * Unified Benchmark Runner
 * Single entry point for running all benchmark types.
 *
 */
import { spawn } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';
import { hideBin } from 'yargs/helpers';
import yargs from 'yargs/yargs';
import { exitWithError } from '../../../development/lib/exit-with-error';
import {
  getFirstParentDirectoryThatExists,
  isWritable,
} from '../../helpers/file';
import type {
  BenchmarkResults,
  ThresholdViolation,
} from '../../../shared/constants/benchmarks';
import {
  DEFAULT_BENCHMARK_BROWSER_LOADS,
  DEFAULT_BENCHMARK_ITERATIONS,
  DEFAULT_BENCHMARK_PAGE_LOADS,
} from '../../../shared/constants/benchmarks';
import { toCamelCase } from '../../../shared/lib/string-utils';
import { runBenchmarkWithIterations, convertSummaryToResults } from './utils';
import {
  STARTUP_PRESETS,
  INTERACTION_PRESETS,
  USER_JOURNEY_PRESETS,
  DAPP_PAGE_LOAD_PRESETS,
  DAPP_PAGE_LOAD_BENCHMARK_SPEC_PATH,
  DAPP_PAGE_LOAD_BENCHMARK_SPEC_BASENAME,
} from './utils/constants';
import { THRESHOLD_REGISTRY } from './utils/thresholds';
import {
  validateResultThresholds,
  logThresholdResult,
} from './utils/statistics';

/**
 * Startup benchmarks handle their own iteration internally (browserLoads x pageLoads).
 * All other benchmarks need external iteration + aggregation via runBenchmarkWithIterations.
 *
 * @param filePath
 */
function supportsIterations(filePath: string): boolean {
  return !filePath.includes('/startup/');
}

/**
 * Playwright benchmark specs are run via `yarn playwright test` (not imported as modules).
 * Includes specs under `test/e2e/playwright/...` and the colocated dapp page-load spec.
 * @param filePath
 */
function isPlaywrightBenchmarkFile(filePath: string): boolean {
  const normalized = filePath.replace(/\\/gu, '/');
  return (
    normalized.includes('/playwright/') ||
    normalized.endsWith(`/${DAPP_PAGE_LOAD_BENCHMARK_SPEC_BASENAME}`) ||
    normalized.endsWith(DAPP_PAGE_LOAD_BENCHMARK_SPEC_BASENAME)
  );
}

/**
 * Extracts platform and buildType from output filename.
 * Expected format: benchmark-{platform}-{buildType}-{preset}.json
 * @param outputFilename - Output filename from --out arg
 * @returns Object with platform and buildType, or empty object if not found
 */
function extractPlatformBuildType(outputFilename?: string): {
  platform?: string;
  buildType?: string;
} {
  if (!outputFilename) {
    return {};
  }

  const outputBasename = path.basename(outputFilename, '.json');
  const match = outputBasename.match(/^benchmark-([^-]+)-([^-]+)-/u);
  if (match) {
    const [, platform, buildType] = match;
    return { platform, buildType };
  }

  return {};
}

/**
 * Builds the registry key for threshold lookup and JSON output.
 *
 * @param fileName - Benchmark flow filename (e.g., 'standard-home', 'load-new-account')
 * @param filePath - Full file path (to detect startup benchmarks)
 * @param preset - Preset name (e.g., 'startupStandardHome', 'interactionUserActions')
 * @returns Registry key (e.g., 'startupStandardHome', 'loadNewAccount', 'onboardingImportWallet')
 */
function buildRegistryKey(
  fileName: string,
  filePath: string,
  preset?: string,
): string {
  const baseName = toCamelCase(fileName);
  const isStartup =
    (preset &&
      Object.values(STARTUP_PRESETS).includes(
        preset as (typeof STARTUP_PRESETS)[keyof typeof STARTUP_PRESETS],
      )) ||
    filePath.includes('/startup/');

  if (isStartup) {
    return `startup${baseName.charAt(0).toUpperCase()}${baseName.slice(1)}`;
  }

  return baseName;
}

const BENCHMARK_DIR = 'test/e2e/benchmarks/flows';

/**
 * Preset definitions mapping preset names to benchmark files.
 * Keys reference the shared constants from ./utils/constants.ts.
 */
const PRESETS: Record<string, string[]> = {
  // User journey benchmarks - Onboarding
  [USER_JOURNEY_PRESETS.ONBOARDING_IMPORT]: [
    `${BENCHMARK_DIR}/user-journey/onboarding-import-wallet.ts`,
  ],
  [USER_JOURNEY_PRESETS.ONBOARDING_NEW]: [
    `${BENCHMARK_DIR}/user-journey/onboarding-new-wallet.ts`,
  ],
  // User journey benchmarks - Assets
  [USER_JOURNEY_PRESETS.ASSETS]: [
    `${BENCHMARK_DIR}/user-journey/asset-details.ts`,
    `${BENCHMARK_DIR}/user-journey/solana-asset-details.ts`,
  ],
  // User journey benchmarks - Accounts
  [USER_JOURNEY_PRESETS.ACCOUNT_MANAGEMENT]: [
    `${BENCHMARK_DIR}/user-journey/import-srp-home.ts`,
  ],
  // User journey benchmarks - Transactions
  [USER_JOURNEY_PRESETS.TRANSACTIONS]: [
    `${BENCHMARK_DIR}/user-journey/send-transactions.ts`,
    `${BENCHMARK_DIR}/user-journey/swap.ts`,
  ],
  // Startup benchmarks
  [STARTUP_PRESETS.STANDARD_HOME]: [
    `${BENCHMARK_DIR}/startup/standard-home.ts`,
  ],
  [STARTUP_PRESETS.POWER_USER_HOME]: [
    `${BENCHMARK_DIR}/startup/power-user-home.ts`,
  ],
  // Interaction benchmarks
  [INTERACTION_PRESETS.USER_ACTIONS]: [
    `${BENCHMARK_DIR}/interaction/load-new-account.ts`,
    `${BENCHMARK_DIR}/interaction/confirm-tx.ts`,
    `${BENCHMARK_DIR}/interaction/bridge-user-actions.ts`,
  ],
  // Dapp page-load benchmark (Playwright-based; runs separately in CI)
  [DAPP_PAGE_LOAD_PRESETS.PAGE_LOAD]: [DAPP_PAGE_LOAD_BENCHMARK_SPEC_PATH],
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
  preset?: string,
  outputFilename?: string,
): Promise<unknown> {
  const absolutePath = pathToFileURL(path.resolve(filePath)).href;
  const fileName = path.basename(filePath, path.extname(filePath));

  if (isPlaywrightBenchmarkFile(filePath)) {
    await runPlaywrightBenchmark(filePath);
    return undefined; // Playwright writes its own output file
  }

  const benchmark = await import(absolutePath);

  if (typeof benchmark.run !== 'function') {
    throw new Error(`No run function found in ${filePath}`);
  }

  const { run: runFn } = benchmark;
  const registryKey = buildRegistryKey(fileName, filePath, preset);
  const thresholdConfig = THRESHOLD_REGISTRY[registryKey];
  if (!thresholdConfig) {
    throw new Error(
      `No threshold config for "${fileName}" (registry key "${registryKey}"). Add an entry to THRESHOLD_REGISTRY in thresholds.ts.`,
    );
  }

  const { platform, buildType } = extractPlatformBuildType(outputFilename);

  let result: BenchmarkResults;
  let violations: ThresholdViolation[];

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
      thresholdConfig,
    );

    console.log(
      `Completed: ${summary.successfulRuns}/${summary.iterations} successful runs`,
    );

    violations = summary.thresholdViolations;
    result = convertSummaryToResults(
      summary,
      testTitle,
      persona,
      summary.benchmarkType,
      platform,
      buildType,
    );
  } else {
    result = (await runFn({
      ...options,
      platform,
      buildType,
    })) as BenchmarkResults;
    violations = validateResultThresholds(result, thresholdConfig).violations;
  }

  logThresholdResult(violations);

  return result;
}

/**
 * Run Playwright benchmark by spawning yarn playwright
 *
 * @param filePath
 */
async function runPlaywrightBenchmark(filePath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const args = ['playwright', 'test', filePath, '--project', 'benchmark'];

    console.log(`Running Playwright benchmark: yarn ${args.join(' ')}`);

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
    .command('$0 [file]', 'Run benchmarks', (cmd) => {
      return cmd.positional('file', {
        type: 'string',
        description: 'Benchmark file path to run',
      });
    })
    .option('preset', {
      alias: 'p',
      type: 'string',
      description: 'Preset group to run',
      choices: presetNames,
    })
    .option('iterations', {
      alias: 'i',
      default: DEFAULT_BENCHMARK_ITERATIONS,
      description:
        'Number of iterations (for performance and user-action benchmarks)',
      type: 'number',
    })
    .option('browserLoads', {
      default: DEFAULT_BENCHMARK_BROWSER_LOADS,
      description: 'Number of browser loads (for page load benchmarks)',
      type: 'number',
    })
    .option('pageLoads', {
      default: DEFAULT_BENCHMARK_PAGE_LOADS,
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
  const fileArg = argv.file as string | undefined;

  if (fileArg) {
    filesToRun = [fileArg];
  } else if (argv.preset) {
    if (!(argv.preset in PRESETS)) {
      throw new Error(`Unknown preset: ${argv.preset}`);
    }
    filesToRun = PRESETS[argv.preset];
    if (filesToRun.length === 0) {
      console.log(
        `⚠️Preset '${argv.preset}' is currently disabled (empty). Skipping.`,
      );
      return;
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
    const resultKey = buildRegistryKey(fileName, filePath, argv.preset);

    try {
      const result = await runBenchmarkFile(
        filePath,
        options,
        argv.preset,
        argv.out,
      );
      // Playwright benchmarks write their own output file, skip storing
      if (isPlaywrightBenchmarkFile(filePath)) {
        continue;
      }
      allResults[resultKey] = result;
    } catch (error) {
      console.error(`❌ Error running ${fileName}:`, error);
      allResults[resultKey] = { error: String(error) };
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
