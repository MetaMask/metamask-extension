import type { ThresholdConfig } from './types';

export const DEFAULT_NUM_BROWSER_LOADS = 10;
export const DEFAULT_NUM_PAGE_LOADS = 10;

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

/**
 * Onboarding import wallet thresholds.
 */
export const ONBOARDING_IMPORT_THRESHOLDS: ThresholdConfig = {
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
  confirmSrpToPasswordForm: {
    p75: { warn: 2700, fail: 3500 },
    p95: { warn: 4200, fail: 5200 },
    ciMultiplier: DEFAULT_CI_MULTIPLIER,
  },
  passwordFormToMetricsScreen: {
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
    p75: { warn: 13500, fail: 17500 },
    p95: { warn: 21000, fail: 26000 },
    ciMultiplier: DEFAULT_CI_MULTIPLIER,
  },
  openAccountMenuToAccountListLoaded: {
    p75: { warn: 43000, fail: 50000 },
    p95: { warn: 50000, fail: 60000 },
    ciMultiplier: DEFAULT_CI_MULTIPLIER,
  },
};

/**
 * Onboarding new wallet thresholds.
 */
export const ONBOARDING_NEW_WALLET_THRESHOLDS: ThresholdConfig = {
  createWalletToSocialScreen: {
    p75: { warn: 1800, fail: 2400 },
    p95: { warn: 2800, fail: 3500 },
    ciMultiplier: DEFAULT_CI_MULTIPLIER,
  },
  srpButtonToPasswordForm: {
    p75: { warn: 1800, fail: 2400 },
    p95: { warn: 2800, fail: 3500 },
    ciMultiplier: DEFAULT_CI_MULTIPLIER,
  },
  createPasswordToRecoveryScreen: {
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
    p75: { warn: 13500, fail: 17500 },
    p95: { warn: 21000, fail: 26000 },
    ciMultiplier: DEFAULT_CI_MULTIPLIER,
  },
};

/**
 * Import SRP from home thresholds.
 */
export const IMPORT_SRP_HOME_THRESHOLDS: ThresholdConfig = {
  loginToHomeScreen: {
    p75: { warn: 9000, fail: 11500 },
    p95: { warn: 14000, fail: 17500 },
    ciMultiplier: DEFAULT_CI_MULTIPLIER,
  },
  openAccountMenuAfterLogin: {
    p75: { warn: 2700, fail: 3500 },
    p95: { warn: 4200, fail: 5200 },
    ciMultiplier: DEFAULT_CI_MULTIPLIER,
  },
  homeAfterImportWithNewWallet: {
    p75: { warn: 27000, fail: 35000 },
    p95: { warn: 42000, fail: 52000 },
    ciMultiplier: DEFAULT_CI_MULTIPLIER,
  },
};

/**
 * Swap flow thresholds.
 */
export const SWAP_THRESHOLDS: ThresholdConfig = {
  openSwapPageFromHome: {
    p75: { warn: 4500, fail: 5800 },
    p95: { warn: 7000, fail: 8700 },
    ciMultiplier: DEFAULT_CI_MULTIPLIER,
  },
  fetchAndDisplaySwapQuotes: {
    p75: { warn: 9000, fail: 11500 },
    p95: { warn: 14000, fail: 17500 },
    ciMultiplier: DEFAULT_CI_MULTIPLIER,
  },
};

/**
 * Send transactions thresholds.
 */
export const SEND_TRANSACTIONS_THRESHOLDS: ThresholdConfig = {
  openSendPageFromHome: {
    p75: { warn: 2700, fail: 3500 },
    p95: { warn: 4200, fail: 5200 },
    ciMultiplier: DEFAULT_CI_MULTIPLIER,
  },
  selectTokenToSendFormLoaded: {
    p75: { warn: 6000, fail: 7500 },
    p95: { warn: 8000, fail: 10000 },
    ciMultiplier: DEFAULT_CI_MULTIPLIER,
  },
  reviewTransactionToConfirmationPage: {
    p75: { warn: 4500, fail: 5800 },
    p95: { warn: 7000, fail: 8700 },
    ciMultiplier: DEFAULT_CI_MULTIPLIER,
  },
};

/**
 * Asset details thresholds (power user).
 */
export const ASSET_DETAILS_THRESHOLDS: ThresholdConfig = {
  assetClickToPriceChart: {
    p75: { warn: 5500, fail: 9000 },
    p95: { warn: 8000, fail: 10000 },
    ciMultiplier: DEFAULT_CI_MULTIPLIER,
  },
};

/**
 * Solana asset details thresholds (power user).
 */
export const SOLANA_ASSET_DETAILS_THRESHOLDS: ThresholdConfig = {
  assetClickToPriceChart: {
    p75: { warn: 5500, fail: 7000 },
    p95: { warn: 8000, fail: 10000 },
    ciMultiplier: DEFAULT_CI_MULTIPLIER,
  },
};
