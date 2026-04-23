import {
  DEFAULT_BENCHMARK_BROWSER_LOADS,
  DEFAULT_BENCHMARK_PAGE_LOADS,
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

export const DAPP_PAGE_LOAD_PRESETS = {
  PAGE_LOAD: 'pageLoadBenchmark',
} as const;

/** Basename of the Playwright entry spec for the dapp page-load benchmark. */
export const DAPP_PAGE_LOAD_BENCHMARK_SPEC_BASENAME =
  'dapp-page-load-benchmark.spec.ts';

/**
 * Repo-relative directory containing the dapp page-load implementation and Playwright spec.
 * Used as Playwright `testDir` for the `benchmark` project (`playwright.config.ts`).
 */
export const DAPP_PAGE_LOAD_BENCHMARK_DIR =
  'test/e2e/benchmarks/flows/dapp-page-load';

/** Repo-relative path to the Playwright spec (from repository root). */
export const DAPP_PAGE_LOAD_BENCHMARK_SPEC_PATH = `${DAPP_PAGE_LOAD_BENCHMARK_DIR}/${DAPP_PAGE_LOAD_BENCHMARK_SPEC_BASENAME}`;

/**
 * Default filename for the merged page-load benchmark JSON (Chrome + Browserify).
 * Keep in sync with `.github/workflows/run-benchmarks.yml` (`DAPP_BENCHMARK_JSON`).
 */
export const DAPP_PAGE_LOAD_BENCHMARK_ARTIFACT_FILENAME =
  'benchmark-chrome-browserify-pageLoadBenchmark.json';

/** Same as {@link DEFAULT_BENCHMARK_BROWSER_LOADS} in `shared/constants/benchmarks`. */
export const DEFAULT_NUM_BROWSER_LOADS = DEFAULT_BENCHMARK_BROWSER_LOADS;
/** Same as {@link DEFAULT_BENCHMARK_PAGE_LOADS} in `shared/constants/benchmarks`. */
export const DEFAULT_NUM_PAGE_LOADS = DEFAULT_BENCHMARK_PAGE_LOADS;

/** Browser loads for the POWER_USER_HOME preset (higher than default to offset warm-up exclusion). */
export const POWER_USER_NUM_BROWSER_LOADS = 15;

/** Number of leading browser-load sessions to discard as warm-up before computing stats. */
export const WARMUP_RUNS = 1;

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
