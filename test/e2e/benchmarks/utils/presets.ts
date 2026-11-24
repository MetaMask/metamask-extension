import {
  DAPP_PAGE_LOAD_BENCHMARK_SPEC_PATH,
  DAPP_PAGE_LOAD_PRESETS,
  INTERACTION_PRESETS,
  STARTUP_PRESETS,
  USER_JOURNEY_PRESETS,
} from './constants';

export const BENCHMARK_DIR = 'test/e2e/benchmarks/flows';

/**
 * Preset definitions mapping preset names to benchmark files.
 * Keys reference the shared constants from ./constants.ts.
 */
export const PRESETS: Record<string, string[]> = {
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
