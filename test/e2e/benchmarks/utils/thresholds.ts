import { type ThresholdConfig } from '../../../../shared/constants/benchmarks';

/**
 * Default CI multiplier for thresholds.
 * CI environments are typically slower than local machines.
 *
 * Per-metric overrides below are calibrated from the 30-day variance audit
 * (MetaMask-planning#7180 / see `benchmark-variance-audit.md`). In general:
 * - Low-CV metrics (CV < 15%) → tighter multiplier (1.2–1.3) to catch real
 * regressions that 1.5× would hide.
 * - Moderate-CV metrics (CV 15–25%) → 1.5× is appropriate.
 * - High-CV metrics (CV 25–50%) → looser multiplier AND the adaptive
 * `(1 + CV/200)` widening in `getEffectiveThreshold` keeps false positives
 * below the Phase 3 target of <5%.
 *
 * Metrics above CV 50% (e.g. `assetClickToPriceChart`) are classified
 * "unreliable" and skipped in `validateThresholds`; no multiplier applies.
 */
export const DEFAULT_CI_MULTIPLIER = 1.5;

/**
 * Multiplier for startup metrics on the `standard` persona.
 * Audit: CV 8–9% (GOOD, tight). 1.5× was loose enough to miss regressions.
 */
const CI_MULTIPLIER_STARTUP_STANDARD = 1.2;

/**
 * Multiplier for startup metrics on the `powerUser` persona.
 * Audit: CV 30–34% (POOR) driven by CI-machine variance amplified by heavier
 * state. Expected to tighten after outlier trimming lands (#7185 / #41520).
 */
const CI_MULTIPLIER_STARTUP_POWER_USER = 2.0;

/**
 * Multiplier for onboarding flow totals and long single-step waits.
 * Audit: CV 7–14% across onboardingImportWallet/onboardingNewWallet totals
 * and `doneButtonTo*` steps. Stable enough for a tighter gate than 1.5×.
 */
const CI_MULTIPLIER_ONBOARDING_TOTAL = 1.3;

/**
 * Multiplier for account-menu rendering steps.
 * Audit: CV 26–37% — driven by test nondeterminism (render depends on
 * controller state-sync timing). Interim value until deterministic waits
 * ship (#7185-B); revisit after that work.
 */
const CI_MULTIPLIER_ACCOUNT_MENU = 1.8;

/**
 * Multiplier for importSrpHome steps.
 * Audit: CV 5.7–18.3% across loginToHomeScreen / homeAfterImportWithNewWallet
 * / total. Stable enough for a tighter gate than 1.5×.
 */
const CI_MULTIPLIER_IMPORT_SRP_HOME = 1.3;

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
    ciMultiplier: DEFAULT_CI_MULTIPLIER,
  },
  srpButtonToSrpForm: {
    p75: { warn: 1800, fail: 2400 },
    p95: { warn: 2800, fail: 3500 },
    ciMultiplier: DEFAULT_CI_MULTIPLIER,
  },
  confirmSrpToPwForm: {
    p75: { warn: 2700, fail: 3500 },
    p95: { warn: 4200, fail: 5200 },
    ciMultiplier: DEFAULT_CI_MULTIPLIER,
  },
  pwFormToMetricsScreen: {
    p75: { warn: 2700, fail: 3500 },
    p95: { warn: 4200, fail: 5200 },
    ciMultiplier: DEFAULT_CI_MULTIPLIER,
  },
  metricsToWalletReadyScreen: {
    p75: { warn: 2700, fail: 3500 },
    p95: { warn: 4200, fail: 5200 },
    ciMultiplier: DEFAULT_CI_MULTIPLIER,
  },
  doneButtonToHomeScreen: {
    p75: { warn: 10500, fail: 14000 },
    p95: { warn: 16000, fail: 21000 },
    ciMultiplier: CI_MULTIPLIER_ONBOARDING_TOTAL,
  },
  openAccountMenuToAccountListLoaded: {
    p75: { warn: 43000, fail: 50000 },
    p95: { warn: 50000, fail: 60000 },
    ciMultiplier: CI_MULTIPLIER_ACCOUNT_MENU,
  },
  ...CLS_THRESHOLDS,
};

const ONBOARDING_NEW_WALLET: ThresholdConfig = {
  createWalletToSocialScreen: {
    p75: { warn: 1800, fail: 2400 },
    p95: { warn: 2800, fail: 3500 },
    ciMultiplier: DEFAULT_CI_MULTIPLIER,
  },
  srpButtonToPwForm: {
    p75: { warn: 1800, fail: 2400 },
    p95: { warn: 2800, fail: 3500 },
    ciMultiplier: DEFAULT_CI_MULTIPLIER,
  },
  createPwToRecoveryScreen: {
    p75: { warn: 2700, fail: 3500 },
    p95: { warn: 4200, fail: 5200 },
    ciMultiplier: DEFAULT_CI_MULTIPLIER,
  },
  skipBackupToMetricsScreen: {
    p75: { warn: 2700, fail: 3500 },
    p95: { warn: 4200, fail: 5200 },
    ciMultiplier: DEFAULT_CI_MULTIPLIER,
  },
  agreeButtonToOnboardingSuccess: {
    p75: { warn: 2700, fail: 3500 },
    p95: { warn: 4200, fail: 5200 },
    ciMultiplier: DEFAULT_CI_MULTIPLIER,
  },
  doneButtonToAssetList: {
    p75: { warn: 10500, fail: 14000 },
    p95: { warn: 16000, fail: 21000 },
    ciMultiplier: CI_MULTIPLIER_ONBOARDING_TOTAL,
  },
  ...CLS_THRESHOLDS,
};

const IMPORT_SRP_HOME: ThresholdConfig = {
  loginToHomeScreen: {
    p75: { warn: 5000, fail: 7000 },
    p95: { warn: 8000, fail: 10500 },
    ciMultiplier: CI_MULTIPLIER_IMPORT_SRP_HOME,
  },
  openAccountMenuAfterLogin: {
    p75: { warn: 2700, fail: 3500 },
    p95: { warn: 4200, fail: 5200 },
    ciMultiplier: CI_MULTIPLIER_ACCOUNT_MENU,
  },
  homeAfterImportWithNewWallet: {
    p75: { warn: 20000, fail: 27000 },
    p95: { warn: 32000, fail: 40000 },
    ciMultiplier: CI_MULTIPLIER_IMPORT_SRP_HOME,
  },
  ...CLS_THRESHOLDS,
};

const SWAP: ThresholdConfig = {
  openSwapPageFromHome: {
    p75: { warn: 3000, fail: 4500 },
    p95: { warn: 5000, fail: 7000 },
    ciMultiplier: DEFAULT_CI_MULTIPLIER,
  },
  fetchAndDisplaySwapQuotes: {
    p75: { warn: 2800, fail: 5000 },
    p95: { warn: 3500, fail: 6000 },
    ciMultiplier: DEFAULT_CI_MULTIPLIER,
  },
  ...CLS_THRESHOLDS,
};

const SEND_TRANSACTIONS: ThresholdConfig = {
  openSendPageFromHome: {
    p75: { warn: 1800, fail: 2700 },
    p95: { warn: 3000, fail: 4000 },
    ciMultiplier: DEFAULT_CI_MULTIPLIER,
  },
  selectTokenToSendFormLoaded: {
    p75: { warn: 4000, fail: 5500 },
    p95: { warn: 6000, fail: 8000 },
    ciMultiplier: DEFAULT_CI_MULTIPLIER,
  },
  reviewTransactionToConfirmationPage: {
    p75: { warn: 3000, fail: 4500 },
    p95: { warn: 5000, fail: 7000 },
    ciMultiplier: DEFAULT_CI_MULTIPLIER,
  },
  ...CLS_THRESHOLDS,
};

const ASSET_DETAILS: ThresholdConfig = {
  assetClickToPriceChart: {
    p75: { warn: 500, fail: 1500 },
    p95: { warn: 1500, fail: 3000 },
    ciMultiplier: DEFAULT_CI_MULTIPLIER,
  },
  ...CLS_THRESHOLDS,
};

const SOLANA_ASSET_DETAILS: ThresholdConfig = {
  assetClickToPriceChart: {
    p75: { warn: 500, fail: 1500 },
    p95: { warn: 1500, fail: 3000 },
    ciMultiplier: DEFAULT_CI_MULTIPLIER,
  },
  ...CLS_THRESHOLDS,
};

const STANDARD_HOME: ThresholdConfig = {
  uiStartup: {
    p75: { warn: 2000, fail: 2500 },
    p95: { warn: 2500, fail: 3200 },
    ciMultiplier: CI_MULTIPLIER_STARTUP_STANDARD,
  },
  load: {
    p75: { warn: 1600, fail: 2200 },
    p95: { warn: 2200, fail: 2800 },
    ciMultiplier: CI_MULTIPLIER_STARTUP_STANDARD,
  },
  loadScripts: {
    p75: { warn: 1400, fail: 1800 },
    p95: { warn: 1800, fail: 2400 },
    ciMultiplier: CI_MULTIPLIER_STARTUP_STANDARD,
  },
  ...CLS_THRESHOLDS,
};

const POWER_USER_HOME: ThresholdConfig = {
  uiStartup: {
    p75: { warn: 4000, fail: 4700 },
    p95: { warn: 7000, fail: 10000 },
    ciMultiplier: CI_MULTIPLIER_STARTUP_POWER_USER,
  },
  load: {
    p75: { warn: 2500, fail: 3500 },
    p95: { warn: 3500, fail: 4500 },
    ciMultiplier: CI_MULTIPLIER_STARTUP_POWER_USER,
  },
  loadScripts: {
    p75: { warn: 2000, fail: 2800 },
    p95: { warn: 2800, fail: 3800 },
    ciMultiplier: CI_MULTIPLIER_STARTUP_POWER_USER,
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
    ciMultiplier: DEFAULT_CI_MULTIPLIER,
  },
};

const CONFIRM_TX: ThresholdConfig = {
  confirm_tx: {
    p75: { warn: 7000, fail: 9000 },
    p95: { warn: 9000, fail: 12000 },
    ciMultiplier: 1.3,
  },
};

const BRIDGE_USER_ACTIONS: ThresholdConfig = {
  bridge_load_page: {
    p75: { warn: 500, fail: 800 },
    p95: { warn: 800, fail: 1200 },
    ciMultiplier: DEFAULT_CI_MULTIPLIER,
  },
  bridge_load_asset_picker: {
    p75: { warn: 500, fail: 800 },
    p95: { warn: 800, fail: 1200 },
    ciMultiplier: DEFAULT_CI_MULTIPLIER,
  },
  bridge_search_token: {
    p75: { warn: 1200, fail: 1800 },
    p95: { warn: 1800, fail: 2500 },
    ciMultiplier: DEFAULT_CI_MULTIPLIER,
  },
};

const DAPP_PAGE_LOAD: ThresholdConfig = {
  pageLoadTime: {
    p75: { warn: 1450, fail: 1700 },
    p95: { warn: 1700, fail: 2000 },
    ciMultiplier: DEFAULT_CI_MULTIPLIER,
  },
  domContentLoaded: {
    p75: { warn: 1000, fail: 1200 },
    p95: { warn: 1300, fail: 1500 },
    ciMultiplier: DEFAULT_CI_MULTIPLIER,
  },
  firstContentfulPaint: {
    p75: { warn: 125, fail: 150 },
    p95: { warn: 130, fail: 150 },
    ciMultiplier: DEFAULT_CI_MULTIPLIER,
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
