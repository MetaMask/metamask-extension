import { METRIC, type MetricKey } from './thresholds';

/**
 * `GATED_METRIC_VALUES` — single source of truth for the gate allowlist.
 *
 * Each entry resolves to a `<benchmarkName>.<metricId>` literal via the
 * `METRIC` namespace, and the `satisfies readonly MetricKey[]` clause
 * rejects raw strings, stale `METRIC.*` paths, and any other entry that
 * doesn't correspond to a threshold-backed metric. Adding or removing an
 * entry changes both the derived `GatedMetric` type and the runtime
 * `GATED_METRICS` `Set` in lockstep — no dual edit required.
 *
 * GRADUATION PROCEDURE
 * --------------------
 * Inputs (rolling 30-day window, ci.branch:main): CV (avg stdDev / avg mean)
 * per metric from Sentry benchmark logs, and FP rate (gated fails on PRs
 * that did not regress in production).
 *
 * Promote (warn → gated) when CV < 30% AND FP rate < 5%, sustained for ≥ 30
 * days. Demote (gated → warn) when CV > 35% OR FP rate > 10% for 2+
 * consecutive weeks. Cadence: monthly review. Output: PR updating the
 * array below.
 */
const GATED_METRIC_VALUES = [
  // Startup (standard persona)
  METRIC.startupStandardHome.uiStartup,
  METRIC.startupStandardHome.load,
  METRIC.startupStandardHome.loadScripts,

  // CLS canary — extension pages should produce CLS ≈ 0
  METRIC.startupStandardHome.cls,
  METRIC.onboardingImportWallet.cls,
  METRIC.onboardingNewWallet.cls,
  METRIC.importSrpHome.cls,
  METRIC.sendTransactions.cls,
  METRIC.swap.cls,
  METRIC.assetDetails.cls,
  METRIC.solanaAssetDetails.cls,

  // Onboarding form-to-form transitions
  METRIC.onboardingImportWallet.doneButtonToHomeScreen,
  METRIC.onboardingNewWallet.doneButtonToAssetList,
  METRIC.importSrpHome.loginToHomeScreen,

  // Flow totals
  METRIC.onboardingImportWallet.total,
  METRIC.onboardingNewWallet.total,
  METRIC.importSrpHome.total,
  METRIC.swap.total,

  // Moderate-variance entries (calibrated via `CI_MULTIPLIER.TIER_2`)
  METRIC.onboardingImportWallet.metricsToWalletReadyScreen,
  METRIC.onboardingNewWallet.agreeButtonToOnboardingSuccess,
  METRIC.importSrpHome.homeAfterImportWithNewWallet,
  METRIC.swap.fetchAndDisplaySwapQuotes,
  METRIC.sendTransactions.openSendPageFromHome,
] as const satisfies readonly MetricKey[];

/**
 * Union of dotted `<benchmarkName>.<metricId>` keys eligible for hard
 * enforcement, derived from `GATED_METRIC_VALUES`. Consumers that need to
 * type-check a key against the allowlist should use this type — non-gated
 * metrics and arbitrary strings are excluded.
 */
export type GatedMetric = (typeof GATED_METRIC_VALUES)[number];

/**
 * GATED_METRICS — runtime mirror of `GATED_METRIC_VALUES`.
 *
 * Metrics in this set: a `fail`-severity threshold breach blocks the PR
 * (`compare-benchmarks` exits 1). Metrics NOT in this set: any `fail`
 * breach is degraded to `warn` in output and does not affect exit status.
 * `THRESHOLD_REGISTRY` is the source of truth for what is a regression;
 * `GatedMetric` (and this set) defines which regressions block PRs.
 */
export const GATED_METRICS: ReadonlySet<GatedMetric> = new Set(
  GATED_METRIC_VALUES,
);
