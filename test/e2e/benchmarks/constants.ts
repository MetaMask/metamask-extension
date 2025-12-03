export const DEFAULT_NUM_BROWSER_LOADS = 10;
export const DEFAULT_NUM_PAGE_LOADS = 10;

/**
 * Number of warmup iterations to discard per browser load.
 * First iterations often have cold-start bias (cold caches, JIT compilation).
 */
export const DEFAULT_WARMUP_ITERATIONS = 1;

/**
 * Timeout threshold in milliseconds.
 * Values above this are likely timeouts/errors and should be excluded.
 */
export const TIMEOUT_THRESHOLD_MS = 30000;

/**
 * Metrics that are time-based and subject to timeout filtering.
 */
export const TIME_BASED_METRICS = [
  'inp',
  'fcp',
  'lcp',
  'tbt',
  'interactionLatency',
  'renderTime',
  'scrollToLoadLatency',
  'cumulativeLoadTime',
  'load',
  'domContentLoaded',
  'firstPaint',
  'tti',
  'fid',
];

/**
 * Remove outliers from an array using IQR method.
 * Returns values within [Q1 - 1.5*IQR, Q3 + 1.5*IQR].
 */
export function removeOutliersIQR(values: number[]): number[] {
  if (values.length < 4) return values;

  const sorted = [...values].sort((a, b) => a - b);
  const q1Index = Math.floor(sorted.length * 0.25);
  const q3Index = Math.floor(sorted.length * 0.75);
  const q1 = sorted[q1Index];
  const q3 = sorted[q3Index];
  const iqr = q3 - q1;

  const lowerBound = q1 - 1.5 * iqr;
  const upperBound = q3 + 1.5 * iqr;

  return sorted.filter((v) => v >= lowerBound && v <= upperBound);
}

/**
 * Filter out timeout values for time-based metrics.
 */
export function filterTimeouts(
  values: number[],
  metricName: string,
  threshold: number = TIMEOUT_THRESHOLD_MS,
): number[] {
  if (!TIME_BASED_METRICS.includes(metricName)) {
    return values;
  }
  return values.filter((v) => v <= threshold);
}

export const ALL_METRICS = {
  uiStartup: 'UI Startup',
  load: 'navigation[0].load',
  domContentLoaded: 'navigation[0].domContentLoaded',
  domInteractive: 'navigation[0].domInteractive',
  firstPaint: 'paint["first-paint"]',
  backgroundConnect: 'Background Connect',
  firstReactRender: 'First Render',
  getState: 'Get State',
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
