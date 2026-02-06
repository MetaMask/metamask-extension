import type { ThresholdConfig } from './types';

export {
  BENCHMARK_PLATFORMS,
  BENCHMARK_BUILD_TYPES,
} from '../../../../shared/constants/benchmarks';
export const STARTUP_PRESETS = {
  STANDARD_HOME: 'startupStandardHome',
  POWER_USER_HOME: 'startupPowerUserHome',
} as const;

export const INTERACTION_PRESETS = {
  USER_ACTIONS: 'interactionUserActions',
} as const;

export const USER_JOURNEY_PRESETS = {
  ONBOARDING_IMPORT: 'userJourneyOnboardingImport',
  ONBOARDING_NEW: 'userJourneyOnboardingNew',
  ASSETS: 'userJourneyAssets',
  ACCOUNT_MANAGEMENT: 'userJourneyAccountManagement',
  TRANSACTIONS: 'userJourneyTransactions',
} as const;

export const DEFAULT_NUM_BROWSER_LOADS = 10;
export const DEFAULT_NUM_PAGE_LOADS = 10;

export const BENCHMARK_PERSONA = {
  STANDARD: 'standard',
  POWER_USER: 'powerUser',
} as const;

export const BENCHMARK_TYPE = {
  BENCHMARK: 'benchmark',
  PERFORMANCE: 'performance',
  USER_ACTION: 'userAction',
} as const;

export const ALL_METRICS = {
  uiStartup: 'UI Startup',
  load: 'navigation[0].load',
  domContentLoaded: 'navigation[0].domContentLoaded',
  domInteractive: 'navigation[0].domInteractive',
  firstPaint: 'paint["first-paint"]',
  backgroundConnect: 'Background Connect',
  firstReactRender: 'First Render',
  initialActions: 'Initial Actions',
  loadScripts: 'Load Scripts',
  setupStore: 'Setup Store',
  numNetworkReqs: 'numNetworkReqs',
  // Long Task / TBT metrics (benchmark-only, via `PerformanceObserver`)
  longTaskCount: 'longTaskCount',
  longTaskTotalDuration: 'longTaskTotalDuration',
  longTaskMaxDuration: 'longTaskMaxDuration',
  tbt: 'tbt',
} as const;

export const WITH_STATE_POWER_USER = {
  withAccounts: 30,
  withConfirmedTransactions: 40,
  withContacts: 40,
  withErc20Tokens: true,
  withNetworks: true,
  withNfts: 20,
  withPreferences: true,
  withUnreadNotifications: 15,
};

/**
 * Default CI multiplier for thresholds.
 * CI environments are typically slower than local machines.
 */
export const DEFAULT_CI_MULTIPLIER = 1.5;

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
    ciMultiplier: DEFAULT_CI_MULTIPLIER,
  },
  openAccountMenuToAccountListLoaded: {
    p75: { warn: 43000, fail: 50000 },
    p95: { warn: 50000, fail: 60000 },
    ciMultiplier: DEFAULT_CI_MULTIPLIER,
  },
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
    ciMultiplier: DEFAULT_CI_MULTIPLIER,
  },
};

const IMPORT_SRP_HOME: ThresholdConfig = {
  loginToHomeScreen: {
    p75: { warn: 5000, fail: 7000 },
    p95: { warn: 8000, fail: 10500 },
    ciMultiplier: DEFAULT_CI_MULTIPLIER,
  },
  openAccountMenuAfterLogin: {
    p75: { warn: 2700, fail: 3500 },
    p95: { warn: 4200, fail: 5200 },
    ciMultiplier: DEFAULT_CI_MULTIPLIER,
  },
  homeAfterImportWithNewWallet: {
    p75: { warn: 20000, fail: 27000 },
    p95: { warn: 32000, fail: 40000 },
    ciMultiplier: DEFAULT_CI_MULTIPLIER,
  },
};

const SWAP: ThresholdConfig = {
  openSwapPageFromHome: {
    p75: { warn: 3000, fail: 4500 },
    p95: { warn: 5000, fail: 7000 },
    ciMultiplier: DEFAULT_CI_MULTIPLIER,
  },
  fetchAndDisplaySwapQuotes: {
    p75: { warn: 1200, fail: 2000 },
    p95: { warn: 2000, fail: 3500 },
    ciMultiplier: DEFAULT_CI_MULTIPLIER,
  },
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
};

const ASSET_DETAILS: ThresholdConfig = {
  assetClickToPriceChart: {
    p75: { warn: 500, fail: 1500 },
    p95: { warn: 1500, fail: 3000 },
    ciMultiplier: DEFAULT_CI_MULTIPLIER,
  },
};

const SOLANA_ASSET_DETAILS: ThresholdConfig = {
  assetClickToPriceChart: {
    p75: { warn: 500, fail: 1500 },
    p95: { warn: 1500, fail: 3000 },
    ciMultiplier: DEFAULT_CI_MULTIPLIER,
  },
};

const STANDARD_HOME: ThresholdConfig = {
  uiStartup: {
    p75: { warn: 2000, fail: 2500 },
    p95: { warn: 2500, fail: 3200 },
    ciMultiplier: DEFAULT_CI_MULTIPLIER,
  },
  load: {
    p75: { warn: 1600, fail: 2200 },
    p95: { warn: 2200, fail: 2800 },
    ciMultiplier: DEFAULT_CI_MULTIPLIER,
  },
  loadScripts: {
    p75: { warn: 1400, fail: 1800 },
    p95: { warn: 1800, fail: 2400 },
    ciMultiplier: DEFAULT_CI_MULTIPLIER,
  },
};

const POWER_USER_HOME: ThresholdConfig = {
  uiStartup: {
    p75: { warn: 3000, fail: 4000 },
    p95: { warn: 4000, fail: 5500 },
    ciMultiplier: DEFAULT_CI_MULTIPLIER,
  },
  load: {
    p75: { warn: 2500, fail: 3500 },
    p95: { warn: 3500, fail: 4500 },
    ciMultiplier: DEFAULT_CI_MULTIPLIER,
  },
  loadScripts: {
    p75: { warn: 2000, fail: 2800 },
    p95: { warn: 2800, fail: 3800 },
    ciMultiplier: DEFAULT_CI_MULTIPLIER,
  },
};

// Threshold keys must match timer IDs emitted by the benchmark flows (snake_case).
/* eslint-disable @typescript-eslint/naming-convention */
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
/* eslint-enable @typescript-eslint/naming-convention */

/**
 * Registry keyed by benchmark file name (kebab-case), auto-converted from
 * UPPER_SNAKE_CASE, e.g. ONBOARDING_IMPORT_WALLET -> onboarding-import-wallet.
 */
export const THRESHOLD_REGISTRY: Record<string, ThresholdConfig> =
  Object.fromEntries(
    Object.entries({
      ONBOARDING_IMPORT_WALLET,
      ONBOARDING_NEW_WALLET,
      IMPORT_SRP_HOME,
      SWAP,
      SEND_TRANSACTIONS,
      ASSET_DETAILS,
      SOLANA_ASSET_DETAILS,
      STANDARD_HOME,
      POWER_USER_HOME,
      LOAD_NEW_ACCOUNT,
      CONFIRM_TX,
      BRIDGE_USER_ACTIONS,
    }).map(([key, config]) => [key.toLowerCase().replace(/_/gu, '-'), config]),
  );
