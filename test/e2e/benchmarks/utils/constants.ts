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
 * Based on TimerHelper effective values (base × 1.1 margin × 1.5 CI).
 */
export const ONBOARDING_IMPORT_THRESHOLDS: ThresholdConfig = {
  importWalletToSocialScreen: {
    p75: { warn: 1800, fail: 2400 },
    p95: { warn: 2800, fail: 3500 },
    ciMultiplier: 1.0,
  },
  srpButtonToSrpForm: {
    p75: { warn: 1800, fail: 2400 },
    p95: { warn: 2800, fail: 3500 },
    ciMultiplier: 1.0,
  },
  confirmSrpToPasswordForm: {
    p75: { warn: 2700, fail: 3500 },
    p95: { warn: 4200, fail: 5200 },
    ciMultiplier: 1.0,
  },
  passwordFormToMetricsScreen: {
    p75: { warn: 2700, fail: 3500 },
    p95: { warn: 4200, fail: 5200 },
    ciMultiplier: 1.0,
  },
  metricsToWalletReadyScreen: {
    p75: { warn: 2700, fail: 3500 },
    p95: { warn: 4200, fail: 5200 },
    ciMultiplier: 1.0,
  },
  doneButtonToHomeScreen: {
    p75: { warn: 13500, fail: 17500 },
    p95: { warn: 21000, fail: 26000 },
    ciMultiplier: 1.0,
  },
  openAccountMenuToAccountListLoaded: {
    p75: { warn: 35000, fail: 40000 },
    p95: { warn: 40000, fail: 50000 },
    ciMultiplier: 1.0,
  },
};

/**
 * Onboarding new wallet thresholds.
 */
export const ONBOARDING_NEW_WALLET_THRESHOLDS: ThresholdConfig = {
  createWalletToSocialScreen: {
    p75: { warn: 1800, fail: 2400 },
    p95: { warn: 2800, fail: 3500 },
    ciMultiplier: 1.0,
  },
  srpButtonToPasswordForm: {
    p75: { warn: 1800, fail: 2400 },
    p95: { warn: 2800, fail: 3500 },
    ciMultiplier: 1.0,
  },
  createPasswordToRecoveryScreen: {
    p75: { warn: 2700, fail: 3500 },
    p95: { warn: 4200, fail: 5200 },
    ciMultiplier: 1.0,
  },
  skipBackupToMetricsScreen: {
    p75: { warn: 2700, fail: 3500 },
    p95: { warn: 4200, fail: 5200 },
    ciMultiplier: 1.0,
  },
  agreeButtonToOnboardingSuccess: {
    p75: { warn: 2700, fail: 3500 },
    p95: { warn: 4200, fail: 5200 },
    ciMultiplier: 1.0,
  },
  doneButtonToAssetList: {
    p75: { warn: 13500, fail: 17500 },
    p95: { warn: 21000, fail: 26000 },
    ciMultiplier: 1.0,
  },
};

/**
 * Import SRP from home thresholds.
 */
export const IMPORT_SRP_HOME_THRESHOLDS: ThresholdConfig = {
  loginToHomeScreen: {
    p75: { warn: 9000, fail: 11500 },
    p95: { warn: 14000, fail: 17500 },
    ciMultiplier: 1.0,
  },
  openAccountMenuAfterLogin: {
    p75: { warn: 2700, fail: 3500 },
    p95: { warn: 4200, fail: 5200 },
    ciMultiplier: 1.0,
  },
  homeAfterImportWithNewWallet: {
    p75: { warn: 27000, fail: 35000 },
    p95: { warn: 42000, fail: 52000 },
    ciMultiplier: 1.0,
  },
};

/**
 * Swap flow thresholds.
 */
export const SWAP_THRESHOLDS: ThresholdConfig = {
  openSwapPageFromHome: {
    p75: { warn: 4500, fail: 5800 },
    p95: { warn: 7000, fail: 8700 },
    ciMultiplier: 1.0,
  },
  fetchAndDisplaySwapQuotes: {
    p75: { warn: 9000, fail: 11500 },
    p95: { warn: 14000, fail: 17500 },
    ciMultiplier: 1.0,
  },
};

/**
 * Send transactions thresholds.
 */
export const SEND_TRANSACTIONS_THRESHOLDS: ThresholdConfig = {
  openSendPageFromHome: {
    p75: { warn: 2700, fail: 3500 },
    p95: { warn: 4200, fail: 5200 },
    ciMultiplier: 1.0,
  },
  selectTokenToSendFormLoaded: {
    p75: { warn: 1800, fail: 2400 },
    p95: { warn: 2800, fail: 3500 },
    ciMultiplier: 1.0,
  },
  reviewTransactionToConfirmationPage: {
    p75: { warn: 4500, fail: 5800 },
    p95: { warn: 7000, fail: 8700 },
    ciMultiplier: 1.0,
  },
};

/**
 * Asset details thresholds (power user).
 */
export const ASSET_DETAILS_THRESHOLDS: ThresholdConfig = {
  assetClickToPriceChart: {
    p75: { warn: 4500, fail: 5800 },
    p95: { warn: 7000, fail: 8700 },
    ciMultiplier: 1.0,
  },
};

/**
 * Solana asset details thresholds (power user).
 */
export const SOLANA_ASSET_DETAILS_THRESHOLDS: ThresholdConfig = {
  assetClickToPriceChart: {
    p75: { warn: 4500, fail: 5800 },
    p95: { warn: 7000, fail: 8700 },
    ciMultiplier: 1.0,
  },
};

/**
 * Example threshold configuration for page load benchmarks.
 * These are more lenient as page loads involve more variables.
 */
export const PAGE_LOAD_THRESHOLDS: ThresholdConfig = {
  [ALL_METRICS.uiStartup]: {
    p75: { warn: 1500, fail: 3000 },
    p95: { warn: 3000, fail: 5000 },
    ciMultiplier: DEFAULT_CI_MULTIPLIER,
  },
  [ALL_METRICS.backgroundConnect]: {
    p75: { warn: 800, fail: 1500 },
    p95: { warn: 1500, fail: 2500 },
    ciMultiplier: DEFAULT_CI_MULTIPLIER,
  },
  [ALL_METRICS.firstReactRender]: {
    p75: { warn: 1200, fail: 2500 },
    p95: { warn: 2500, fail: 4000 },
    ciMultiplier: DEFAULT_CI_MULTIPLIER,
  },
  [ALL_METRICS.loadScripts]: {
    p75: { warn: 1500, fail: 3000 },
    p95: { warn: 3000, fail: 5000 },
    ciMultiplier: DEFAULT_CI_MULTIPLIER,
  },
  [ALL_METRICS.setupStore]: {
    p75: { warn: 800, fail: 1500 },
    p95: { warn: 1500, fail: 2500 },
    ciMultiplier: DEFAULT_CI_MULTIPLIER,
  },
};
