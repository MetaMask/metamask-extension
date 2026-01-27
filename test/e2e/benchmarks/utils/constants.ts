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
 * Default CI multiplier for thresholds
 * CI environments are typically slower than local machines
 */
export const DEFAULT_CI_MULTIPLIER = 1.5;

/**
 * Example threshold configuration for onboarding import wallet benchmark
 * Thresholds are in milliseconds, validated against P75 (typical) and P95 (worst-case)
 *
 * Usage:
 *   runBenchmarkWithIterations(
 *     'onboarding-import-wallet',
 *     benchmarkFn,
 *     iterations,
 *     retries,
 *     ONBOARDING_IMPORT_THRESHOLDS
 *   )
 */
export const ONBOARDING_IMPORT_THRESHOLDS: ThresholdConfig = {
  import_wallet_to_social_screen: {
    p75: { warn: 800, fail: 1500 },
    p95: { warn: 1500, fail: 2500 },
    ciMultiplier: DEFAULT_CI_MULTIPLIER,
  },
  srp_button_to_form: {
    p75: { warn: 400, fail: 800 },
    p95: { warn: 800, fail: 1500 },
    ciMultiplier: DEFAULT_CI_MULTIPLIER,
  },
  srp_confirm_to_password: {
    p75: { warn: 800, fail: 1500 },
    p95: { warn: 1500, fail: 2500 },
    ciMultiplier: DEFAULT_CI_MULTIPLIER,
  },
  password_to_metrics: {
    p75: { warn: 800, fail: 1500 },
    p95: { warn: 1500, fail: 2500 },
    ciMultiplier: DEFAULT_CI_MULTIPLIER,
  },
  metrics_to_complete: {
    p75: { warn: 800, fail: 1500 },
    p95: { warn: 1500, fail: 2500 },
    ciMultiplier: DEFAULT_CI_MULTIPLIER,
  },
  complete_to_home_with_assets: {
    p75: { warn: 4000, fail: 8000 },
    p95: { warn: 8000, fail: 15000 },
    ciMultiplier: DEFAULT_CI_MULTIPLIER,
  },
  open_account_list: {
    p75: { warn: 400, fail: 800 },
    p95: { warn: 800, fail: 1500 },
    ciMultiplier: DEFAULT_CI_MULTIPLIER,
  },
};

/**
 * Example threshold configuration for page load benchmarks
 * These are more lenient as page loads involve more variables
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
