import { type ThresholdConfig } from '../../../../shared/constants/benchmarks';

/**
 * CI multipliers for benchmark thresholds.
 *
 * Threshold values are calibrated against local timings; this multiplier
 * scales them at gate time to absorb the additional variance CI machines
 * introduce. Assign by tier band when a metric's variance fits cleanly;
 * use a flow- or circumstance-specific value where bands don't apply.
 *
 * Band guidance: Tier 1 is for sustained low variance — tighter than
 * `DEFAULT` to catch real regressions that 1.5× would hide. Tier 2 is for
 * moderate variance — wider headroom without masking regressions; the
 * adaptive `(1 + CV/200)` widening in `getEffectiveThreshold` further
 * compensates for per-run spread. Above-band variance is classified
 * "unreliable" and skipped in `validateThresholds`; no multiplier applies.
 */
export const CI_MULTIPLIER = {
  /** No widening — time-independent metrics (counts, ratios, unitless scores). */
  NONE: 1.0,
  /** Tier 1 band — sustained low variance; tighter gate than `DEFAULT`. */
  TIER_1: 1.3,
  /** Tier 2 band — moderate variance; calibrated headroom. */
  TIER_2: 1.7,
  /** Fallback for uncharacterized metrics. */
  DEFAULT: 1.5,
  /** Startup, standard persona — CI envelope tighter than `DEFAULT`. */
  STARTUP_STANDARD: 1.2,
  /** Startup, powerUser persona — wider envelope to absorb machine + state variance. */
  STARTUP_POWER_USER: 2.0,
  /** Account-menu rendering — interim band pending harness determinism work. */
  ACCOUNT_MENU: 1.8,
} as const;

/**
 * CLS (Cumulative Layout Shift) canary thresholds.
 * Extension pages should produce CLS ≈ 0; any measurable shift is a real
 * signal (lazy-loaded component, dynamic banner, skeleton screen).
 * Unitless — no CI multiplier needed. Uses Google's standard CWV boundaries:
 * p75 ≤ 0.1 "good" / ≤ 0.25 "needs-improvement" / > 0.25 "poor".
 */
const CLS_THRESHOLDS = {
  cls: {
    p75: { warn: 0.1, fail: 0.25 },
    p95: { warn: 0.1, fail: 0.25 },
  },
} satisfies ThresholdConfig;

const ONBOARDING_IMPORT_WALLET: ThresholdConfig = {
  importWalletToSocialScreen: {
    p75: { warn: 1800, fail: 2400 },
    p95: { warn: 2800, fail: 3500 },
    ciMultiplier: CI_MULTIPLIER.DEFAULT,
  },
  srpButtonToSrpForm: {
    p75: { warn: 1800, fail: 2400 },
    p95: { warn: 2800, fail: 3500 },
    ciMultiplier: CI_MULTIPLIER.DEFAULT,
  },
  confirmSrpToPwForm: {
    p75: { warn: 2700, fail: 3500 },
    p95: { warn: 4200, fail: 5200 },
    ciMultiplier: CI_MULTIPLIER.DEFAULT,
  },
  pwFormToMetricsScreen: {
    p75: { warn: 2700, fail: 3500 },
    p95: { warn: 4200, fail: 5200 },
    ciMultiplier: CI_MULTIPLIER.DEFAULT,
  },
  metricsToWalletReadyScreen: {
    p75: { warn: 2700, fail: 3500 },
    p95: { warn: 4200, fail: 5200 },
    ciMultiplier: CI_MULTIPLIER.TIER_2,
  },
  doneButtonToHomeScreen: {
    p75: { warn: 10500, fail: 14000 },
    p95: { warn: 16000, fail: 21000 },
    ciMultiplier: CI_MULTIPLIER.TIER_1,
  },
  openAccountMenuToAccountListLoaded: {
    p75: { warn: 43000, fail: 50000 },
    p95: { warn: 50000, fail: 60000 },
    ciMultiplier: CI_MULTIPLIER.ACCOUNT_MENU,
  },
  total: {
    p75: { warn: 6800, fail: 7400 },
    p95: { warn: 7300, fail: 7900 },
    ciMultiplier: CI_MULTIPLIER.TIER_1,
  },
  ...CLS_THRESHOLDS,
};

const ONBOARDING_NEW_WALLET: ThresholdConfig = {
  createWalletToSocialScreen: {
    p75: { warn: 1800, fail: 2400 },
    p95: { warn: 2800, fail: 3500 },
    ciMultiplier: CI_MULTIPLIER.DEFAULT,
  },
  srpButtonToPwForm: {
    p75: { warn: 1800, fail: 2400 },
    p95: { warn: 2800, fail: 3500 },
    ciMultiplier: CI_MULTIPLIER.DEFAULT,
  },
  createPwToRecoveryScreen: {
    p75: { warn: 2700, fail: 3500 },
    p95: { warn: 4200, fail: 5200 },
    ciMultiplier: CI_MULTIPLIER.DEFAULT,
  },
  skipBackupToMetricsScreen: {
    p75: { warn: 2700, fail: 3500 },
    p95: { warn: 4200, fail: 5200 },
    ciMultiplier: CI_MULTIPLIER.DEFAULT,
  },
  agreeButtonToOnboardingSuccess: {
    p75: { warn: 2700, fail: 3500 },
    p95: { warn: 4200, fail: 5200 },
    ciMultiplier: CI_MULTIPLIER.TIER_2,
  },
  doneButtonToAssetList: {
    p75: { warn: 10500, fail: 14000 },
    p95: { warn: 16000, fail: 21000 },
    ciMultiplier: CI_MULTIPLIER.TIER_1,
  },
  total: {
    p75: { warn: 3300, fail: 3600 },
    p95: { warn: 3650, fail: 3950 },
    ciMultiplier: CI_MULTIPLIER.TIER_1,
  },
  ...CLS_THRESHOLDS,
};

const IMPORT_SRP_HOME: ThresholdConfig = {
  loginToHomeScreen: {
    p75: { warn: 5000, fail: 7000 },
    p95: { warn: 8000, fail: 10500 },
    ciMultiplier: CI_MULTIPLIER.TIER_1,
  },
  openAccountMenuAfterLogin: {
    p75: { warn: 2700, fail: 3500 },
    p95: { warn: 4200, fail: 5200 },
    ciMultiplier: CI_MULTIPLIER.ACCOUNT_MENU,
  },
  homeAfterImportWithNewWallet: {
    p75: { warn: 20000, fail: 27000 },
    p95: { warn: 32000, fail: 40000 },
    ciMultiplier: CI_MULTIPLIER.TIER_2,
  },
  total: {
    p75: { warn: 28000, fail: 30500 },
    p95: { warn: 30000, fail: 32500 },
    ciMultiplier: CI_MULTIPLIER.TIER_1,
  },
  ...CLS_THRESHOLDS,
};

const SWAP: ThresholdConfig = {
  openSwapPageFromHome: {
    p75: { warn: 3000, fail: 4500 },
    p95: { warn: 5000, fail: 7000 },
    ciMultiplier: CI_MULTIPLIER.DEFAULT,
  },
  fetchAndDisplaySwapQuotes: {
    p75: { warn: 2800, fail: 5000 },
    p95: { warn: 3500, fail: 6000 },
    ciMultiplier: CI_MULTIPLIER.TIER_2,
  },
  total: {
    p75: { warn: 1800, fail: 1950 },
    p95: { warn: 1900, fail: 2050 },
    ciMultiplier: CI_MULTIPLIER.DEFAULT,
  },
  ...CLS_THRESHOLDS,
};

const SEND_TRANSACTIONS: ThresholdConfig = {
  openSendPageFromHome: {
    p75: { warn: 1800, fail: 2700 },
    p95: { warn: 3000, fail: 4000 },
    ciMultiplier: CI_MULTIPLIER.TIER_2,
  },
  selectTokenToSendFormLoaded: {
    p75: { warn: 4000, fail: 5500 },
    p95: { warn: 6000, fail: 8000 },
    ciMultiplier: CI_MULTIPLIER.DEFAULT,
  },
  reviewTransactionToConfirmationPage: {
    p75: { warn: 3000, fail: 4500 },
    p95: { warn: 5000, fail: 7000 },
    ciMultiplier: CI_MULTIPLIER.DEFAULT,
  },
  ...CLS_THRESHOLDS,
};

const ASSET_DETAILS: ThresholdConfig = {
  assetClickToPriceChart: {
    p75: { warn: 500, fail: 1500 },
    p95: { warn: 1500, fail: 3000 },
    ciMultiplier: CI_MULTIPLIER.DEFAULT,
  },
  ...CLS_THRESHOLDS,
};

const SOLANA_ASSET_DETAILS: ThresholdConfig = {
  assetClickToPriceChart: {
    p75: { warn: 500, fail: 1500 },
    p95: { warn: 1500, fail: 3000 },
    ciMultiplier: CI_MULTIPLIER.DEFAULT,
  },
  ...CLS_THRESHOLDS,
};

const STANDARD_HOME: ThresholdConfig = {
  uiStartup: {
    p75: { warn: 2000, fail: 2500 },
    p95: { warn: 2500, fail: 3200 },
    ciMultiplier: CI_MULTIPLIER.STARTUP_STANDARD,
  },
  load: {
    p75: { warn: 1600, fail: 2200 },
    p95: { warn: 2200, fail: 2800 },
    ciMultiplier: CI_MULTIPLIER.STARTUP_STANDARD,
  },
  loadScripts: {
    p75: { warn: 1400, fail: 1800 },
    p95: { warn: 1800, fail: 2400 },
    ciMultiplier: CI_MULTIPLIER.STARTUP_STANDARD,
  },
  ...CLS_THRESHOLDS,
};

const POWER_USER_HOME: ThresholdConfig = {
  uiStartup: {
    p75: { warn: 4000, fail: 4700 },
    p95: { warn: 7000, fail: 10000 },
    ciMultiplier: CI_MULTIPLIER.STARTUP_POWER_USER,
  },
  load: {
    p75: { warn: 2500, fail: 3500 },
    p95: { warn: 3500, fail: 4500 },
    ciMultiplier: CI_MULTIPLIER.STARTUP_POWER_USER,
  },
  loadScripts: {
    p75: { warn: 2000, fail: 2800 },
    p95: { warn: 2800, fail: 3800 },
    ciMultiplier: CI_MULTIPLIER.STARTUP_POWER_USER,
  },
  ...CLS_THRESHOLDS,
};

// Threshold keys must match timer IDs emitted by the benchmark flows (snake_case).
/* eslint-disable @typescript-eslint/naming-convention */
// Interaction benchmarks: no CLS thresholds. Short single-action measurements
// capture layout shifts from the benchmark harness (INP probe, navigation),
// not from application rendering behavior. CLS applies to startup + journey only.
const LOAD_NEW_ACCOUNT: ThresholdConfig = {
  load_new_account: {
    p75: { warn: 800, fail: 1200 },
    p95: { warn: 1200, fail: 1800 },
    ciMultiplier: CI_MULTIPLIER.DEFAULT,
  },
};

const CONFIRM_TX: ThresholdConfig = {
  confirm_tx: {
    p75: { warn: 7000, fail: 9000 },
    p95: { warn: 9000, fail: 12000 },
    ciMultiplier: CI_MULTIPLIER.TIER_1,
  },
};

const BRIDGE_USER_ACTIONS: ThresholdConfig = {
  bridge_load_page: {
    p75: { warn: 500, fail: 800 },
    p95: { warn: 800, fail: 1200 },
    ciMultiplier: CI_MULTIPLIER.DEFAULT,
  },
  bridge_load_asset_picker: {
    p75: { warn: 500, fail: 800 },
    p95: { warn: 800, fail: 1200 },
    ciMultiplier: CI_MULTIPLIER.DEFAULT,
  },
  bridge_search_token: {
    p75: { warn: 1200, fail: 1800 },
    p95: { warn: 1800, fail: 2500 },
    ciMultiplier: CI_MULTIPLIER.DEFAULT,
  },
};

const DAPP_PAGE_LOAD: ThresholdConfig = {
  pageLoadTime: {
    p75: { warn: 1450, fail: 1700 },
    p95: { warn: 1700, fail: 2000 },
    ciMultiplier: CI_MULTIPLIER.DEFAULT,
  },
  domContentLoaded: {
    p75: { warn: 1000, fail: 1200 },
    p95: { warn: 1300, fail: 1500 },
    ciMultiplier: CI_MULTIPLIER.DEFAULT,
  },
  firstContentfulPaint: {
    p75: { warn: 125, fail: 150 },
    p95: { warn: 130, fail: 150 },
    ciMultiplier: CI_MULTIPLIER.DEFAULT,
  },
};
/* eslint-enable @typescript-eslint/naming-convention */

/**
 * Threshold configurations for all benchmarks.
 */
const BENCHMARK_THRESHOLDS = {
  // Interaction benchmarks (run on all 4 combos, shared baseline)
  loadNewAccount: LOAD_NEW_ACCOUNT,
  confirmTx: CONFIRM_TX,
  bridgeUserActions: BRIDGE_USER_ACTIONS,

  // User journey benchmarks (chrome-browserify in PRs, chrome-webpack on main/release)
  onboardingImportWallet: ONBOARDING_IMPORT_WALLET,
  onboardingNewWallet: ONBOARDING_NEW_WALLET,
  importSrpHome: IMPORT_SRP_HOME,
  assetDetails: ASSET_DETAILS,
  solanaAssetDetails: SOLANA_ASSET_DETAILS,
  sendTransactions: SEND_TRANSACTIONS,
  swap: SWAP,

  // Dapp page load benchmarks (chrome-browserify)
  dappPageLoad: DAPP_PAGE_LOAD,

  // Startup benchmarks (platform/buildType now stored in data, not in key)
  startupStandardHome: STANDARD_HOME,
  startupPowerUserHome: POWER_USER_HOME,
};

/**
 * Registry of threshold configurations keyed by benchmark name (camelCase).
 *
 * To add a new benchmark:
 * - Add to BENCHMARK_THRESHOLDS with a camelCase key matching the filename
 * - All benchmarks now use simple keys; platform/buildType are stored as data fields
 */
export const THRESHOLD_REGISTRY: Record<string, ThresholdConfig> = {
  ...BENCHMARK_THRESHOLDS,
};
