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

  // PAUSED — the nine CUF-derived timing metrics, per #46078.
  //
  // Left the allowlist: `importSrpHome.loginToHomeScreen`,
  // `importSrpHome.homeAfterImportWithNewWallet`, `importSrpHome.total`,
  // `onboardingImportWallet.total`,
  // `onboardingImportWallet.metricsToWalletReadyScreen`,
  // `onboardingNewWallet.agreeButtonToOnboardingSuccess`, `swap.total`,
  // `swap.fetchAndDisplaySwapQuotes`, `sendTransactions.openSendPageFromHome`.
  //
  // These are not demotions under the procedure above, and no threshold value
  // would fix them. Each is timed by `TimerHelper` in the Node test process, so
  // the value is application work plus WebDriver round-trip plus poll interval,
  // inseparably, and a wait-terminated step cannot resolve finer than 200ms
  // (#46006). A `.total` is the sum of those step timers rather than a
  // measurement of its flow (#45452), so it inherits every one of their
  // defects by construction.
  //
  // `onboardingImportWallet.total` is among them and is the only metric that
  // has ever blocked a pull request — 27 of 116 Chrome runs on `main`,
  // 2026-08-27 to 09-03. The gate therefore stops blocking on timing entirely.
  //
  // The flows themselves keep running. Only the timing entries leave the
  // allowlist, because seven of the eight CLS canaries above are produced by
  // these same flows, and CLS is unaffected by the step-timer defects — it is
  // read in-page by `web-vitals` rather than timed from the driver.
  //
  // Restore condition per flow. Every ticket listed for a flow must close, and
  // restoring is not a revert: a metric returns by qualifying under the
  // procedure above against data produced after those fixes, never by being
  // added back.
  //
  //   all paused flows  #46006 step clock · #45452 step partition and `.total`
  //                     · #45205 ceilings derived from the gated population
  //                     · #7204 percentiles averaged independently
  //                     · #45431 a failed iteration emits nothing
  //   onboarding        + #45266 bimodal ~37% slow path · #7280 password
  //                     transition timers measuring a near-empty window
  //   swap, send        + #7281 sub-50ms steps below the detection floor
  //                     · #7202 deterministic render-complete waits
  //   import-srp        + #7202
  //
  // Previously demoted under the procedure above, and unaffected by the pause:
  // `onboardingNewWallet.doneButtonToAssetList` and the import flow's
  // `doneButtonToHomeScreen` are the same ~37% per-iteration slow path (24/65
  // and 30/80 slow draws), so each is a coin flip rather than a measurement of
  // one thing; `onboardingNewWallet.total` carries that slow path into the sum
  // because its slow step is terminal, at CV 41.8% against a demote bar of 35%
  // and an 11/14 false-positive rate against a bar of 10%. Restore condition
  // for all three: #45266.
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
