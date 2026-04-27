/**
 * GATED_METRICS — enforcement-eligible benchmark metrics.
 *
 * Keys use dotted form `<benchmarkName>.<metricId>` matching the
 * THRESHOLD_REGISTRY structure (e.g. `startupStandardHome.uiStartup`).
 *
 * Metrics in this set: a `fail`-severity threshold breach blocks the PR
 * (compare-benchmarks exits 1).
 *
 * Metrics NOT in this set: any `fail`-severity breach is degraded to `warn`
 * in output and does not affect exit status. Threshold definitions in
 * THRESHOLD_REGISTRY are unchanged either way — THRESHOLD_REGISTRY is the
 * source of truth for what is a regression; GATED_METRICS defines which
 * regressions block PRs.
 *
 * GRADUATION PROCEDURE
 * --------------------
 * Inputs (rolling 30-day window, ci.branch:main): CV (avg stdDev / avg mean)
 * per metric from Sentry benchmark logs, and FP rate (gated fails on PRs
 * that did not regress in production).
 *
 * Promote (warn → gated) when CV < 30% AND FP rate < 5%, sustained for ≥ 30
 * days. Demote (gated → warn) when CV > 35% OR FP rate > 10% for 2+
 * consecutive weeks. Cadence: monthly review. Output: PR updating this file.
 *
 * Initial allowlist sourced from the April 2026 variance audit
 * (`benchmark-variance-audit.md`) — Tier 1 entries with CV < 15%.
 *
 * Deliberately deferred (out of scope for the initial allowlist):
 * `startupPowerUserHome.*` (CV 30–34%, blocked on outlier filtering #7185
 * and harness fixes); per-flow `tbt` gating (graduates via #7195 once
 * observation window completes); `*.total` and `domContentLoaded` entries
 * (not yet present in THRESHOLD_REGISTRY); and the send-page step timers
 * (anomalous within-run stdDev — investigate harness before gating).
 */
export const GATED_METRICS: ReadonlySet<string> = new Set([
  // Startup standard persona (CV 8–9%) — powerUser excluded pending #7185
  'startupStandardHome.uiStartup',
  'startupStandardHome.load',
  'startupStandardHome.loadScripts',

  // CLS canary — always 0, zero variance, applied across journey + startup
  'startupStandardHome.cls',
  'onboardingImportWallet.cls',
  'onboardingNewWallet.cls',
  'importSrpHome.cls',
  'sendTransactions.cls',
  'swap.cls',
  'assetDetails.cls',
  'solanaAssetDetails.cls',

  // Onboarding form-to-form transitions (CV 5.7–13.7%)
  'onboardingImportWallet.doneButtonToHomeScreen',
  'onboardingNewWallet.doneButtonToAssetList',
  'importSrpHome.loginToHomeScreen',
]);
