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
 * The Set literal below is the source of truth for what is gated; absence
 * from the set implies a metric is informational-only — see graduation
 * procedure above for how to add or remove entries.
 */
export const GATED_METRICS: ReadonlySet<string> = new Set([
  // Startup (standard persona)
  'startupStandardHome.uiStartup',
  'startupStandardHome.load',
  'startupStandardHome.loadScripts',

  // CLS canary — extension pages should produce CLS ≈ 0
  'startupStandardHome.cls',
  'onboardingImportWallet.cls',
  'onboardingNewWallet.cls',
  'importSrpHome.cls',
  'sendTransactions.cls',
  'swap.cls',
  'assetDetails.cls',
  'solanaAssetDetails.cls',

  // Onboarding form-to-form transitions
  'onboardingImportWallet.doneButtonToHomeScreen',
  'onboardingNewWallet.doneButtonToAssetList',
  'importSrpHome.loginToHomeScreen',

  // Flow totals
  'onboardingImportWallet.total',
  'onboardingNewWallet.total',
  'importSrpHome.total',
  'swap.total',

  // Tier 2 — gated with CI_MULTIPLIER_TIER_2 to absorb moderate variance
  'onboardingImportWallet.metricsToWalletReadyScreen',
  'onboardingNewWallet.agreeButtonToOnboardingSuccess',
  'importSrpHome.homeAfterImportWithNewWallet',
  'swap.fetchAndDisplaySwapQuotes',
  'sendTransactions.openSendPageFromHome',
]);
