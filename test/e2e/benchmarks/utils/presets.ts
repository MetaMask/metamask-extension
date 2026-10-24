import path from 'path';

import {
  BENCHMARK_BUILD_TYPES,
  BENCHMARK_PLATFORMS,
} from '../../../../shared/constants/benchmarks';
import { toCamelCase } from '../../../../shared/lib/string-utils';
import {
  DAPP_PAGE_LOAD_BENCHMARK_SPEC_PATH,
  DAPP_PAGE_LOAD_PRESETS,
  INTERACTION_PRESETS,
  STARTUP_PRESETS,
  USER_JOURNEY_PRESETS,
} from './constants';

const BENCHMARK_DIR = 'test/e2e/benchmarks/flows';

/**
 * Preset definitions mapping preset names to benchmark files.
 * Keys reference the shared constants from ./constants.ts.
 */
export const PRESET_BENCHMARK_FILES: Record<string, string[]> = {
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

/**
 * Builds the registry key for threshold lookup and JSON output.
 *
 * @param fileName - Benchmark flow filename (e.g., 'standard-home', 'load-new-account')
 * @param filePath - Full file path (to detect startup benchmarks)
 * @param preset - Preset name (e.g., 'startupStandardHome', 'interactionUserActions')
 * @returns Registry key (e.g., 'startupStandardHome', 'loadNewAccount', 'onboardingImportWallet')
 */
export function buildRegistryKey(
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

/**
 * Presets that CI runs once per browser, as the `pageType` matrix leg of the
 * `benchmarks` job in `.github/workflows/run-benchmarks.yml`.
 *
 * The page-load preset is deliberately absent: it runs in its own
 * single-browser job (`benchmarks-page-load`), not in the matrix.
 */
export const MATRIX_PRESETS: readonly string[] = [
  ...Object.values(STARTUP_PRESETS),
  ...Object.values(INTERACTION_PRESETS),
  ...Object.values(USER_JOURNEY_PRESETS),
];

/**
 * Registry keys that do not follow `buildRegistryKey`'s filename derivation.
 *
 * The dapp page-load benchmark is a Playwright spec rather than a runner flow,
 * so its key comes from `dappPageLoadStatsToBenchmarkResults` and does not
 * match its spec filename.
 */
const REGISTRY_KEY_OVERRIDES: Record<string, string[]> = {
  [DAPP_PAGE_LOAD_PRESETS.PAGE_LOAD]: ['dappPageLoad'],
};

/**
 * Benchmark registry keys a preset is expected to write.
 *
 * Derived from the same file list the runner executes, so a flow added to or
 * removed from a preset changes this in lockstep.
 *
 * @param preset - Preset name.
 * @returns Registry keys (e.g. `['sendTransactions', 'swap']`).
 */
export function benchmarkNamesForPreset(preset: string): string[] {
  const override = REGISTRY_KEY_OVERRIDES[preset];
  if (override) {
    return [...override];
  }

  return (PRESET_BENCHMARK_FILES[preset] ?? []).map((filePath) =>
    buildRegistryKey(path.basename(filePath, '.ts'), filePath, preset),
  );
}

export type ExpectedArtifact = {
  /** Artifact basename without the `.json` extension. */
  artifactName: string;
  browser: string;
  buildType: string;
  preset: string;
  /** Registry keys this artifact is expected to carry. */
  benchmarkNames: string[];
};

/**
 * The full set of benchmark artifacts a complete CI run produces.
 *
 * The gate needs this because it reads its input by listing a directory: an
 * artifact that was never uploaded is otherwise indistinguishable from one that
 * was never expected, so a benchmark that crashes or times out silently reduces
 * coverage instead of failing anything.
 *
 * The same expectation already drives the `missingPresets` warning in the PR
 * comment (`fetchBenchmarkEntries` in `performance-benchmarks.ts`); this makes
 * it available to the gate, which until now only saw a shorter file list.
 *
 * @returns One entry per expected artifact.
 */
export function expectedBenchmarkArtifacts(): ExpectedArtifact[] {
  const artifacts: ExpectedArtifact[] = [];

  for (const browser of Object.values(BENCHMARK_PLATFORMS)) {
    for (const buildType of Object.values(BENCHMARK_BUILD_TYPES)) {
      for (const preset of MATRIX_PRESETS) {
        artifacts.push({
          artifactName: `benchmark-${browser}-${buildType}-${preset}`,
          browser,
          buildType,
          preset,
          benchmarkNames: benchmarkNamesForPreset(preset),
        });
      }
    }
  }

  // The dapp page-load benchmark runs chrome-only, in its own job.
  const pageLoadPreset = DAPP_PAGE_LOAD_PRESETS.PAGE_LOAD;
  artifacts.push({
    artifactName: `benchmark-${BENCHMARK_PLATFORMS.CHROME}-${BENCHMARK_BUILD_TYPES.WEBPACK}-${pageLoadPreset}`,
    browser: BENCHMARK_PLATFORMS.CHROME,
    buildType: BENCHMARK_BUILD_TYPES.WEBPACK,
    preset: pageLoadPreset,
    benchmarkNames: benchmarkNamesForPreset(pageLoadPreset),
  });

  return artifacts;
}
