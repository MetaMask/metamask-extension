/**
 * Benchmark comparison module.
 *
 * Two-layer approach:
 *
 * 1. Absolute gate: validates p75/p95 against constant limits.
 * This is the primary pass/fail authority that prevents performance drift.
 * Reuses validateResultThresholds from the benchmark statistics module.
 *
 * 2. Relative context: compares current values against a historical baseline
 * and computes informational delta % with traffic-light indications.
 * Does NOT affect pass/fail.
 */

import type {
  BenchmarkResults,
  HistoricalBaselineMetrics,
  ThresholdConfig,
  ThresholdViolation,
  RelativeThresholds,
  ComparisonKey,
} from '../../shared/constants/benchmarks';
import {
  BENCHMARK_PLATFORMS,
  PERCENTILE_KEY,
  STAT_KEY,
  THRESHOLD_SEVERITY,
  DEFAULT_RELATIVE_THRESHOLDS,
} from '../../shared/constants/benchmarks';
import { validateResultThresholds } from '../../test/e2e/benchmarks/utils/statistics';

export const COMPARISON_SEVERITY = {
  Regression: { value: 'regression' as const, icon: '🔴' },
  Warn: { value: 'warn' as const, icon: '🟡' },
  Pass: { value: 'pass' as const, icon: '🟢' },
} as const;
export type ComparisonSeverity =
  (typeof COMPARISON_SEVERITY)[keyof typeof COMPARISON_SEVERITY]['value'];

export type MetricComparison = {
  metric: string;
  percentile: ComparisonKey;
  current: number;
  baseline: number;
  delta: number;
  deltaPercent: number;
  severity: ComparisonSeverity;
  indication: string;
};

export type BenchmarkEntryComparison = {
  benchmarkName: string;
  source?: string; // e.g., 'chrome-browserify'
  relativeMetrics: MetricComparison[];
  absoluteViolations: ThresholdViolation[];
  hasRegression: boolean;
  hasWarning: boolean;
  absoluteFailed: boolean;
};

const iconForSeverity = (severity: ComparisonSeverity): string =>
  Object.values(COMPARISON_SEVERITY).find((s) => s.value === severity)?.icon ??
  COMPARISON_SEVERITY.Pass.icon;

/**
 * Formats a delta percentage as a human-readable string.
 * Sign is derived from the value: positive = slower (+X%), negative = faster (-X%).
 *
 * @param deltaPercent - Delta as a fraction (0.1 = 10%, -0.08 = -8%).
 */
export function formatDeltaPercent(deltaPercent: number): string {
  const pct = Number((deltaPercent * 100).toFixed(1));
  if (pct === 0) {
    return '0.0%';
  }
  const sign = pct > 0 ? '+' : '';
  return `${sign}${pct}%`;
}

/**
 * Compares a single metric value against a baseline and returns severity
 * and traffic-light indication. delta > 0 means slower (regression direction).
 *
 * @param metric - Metric name.
 * @param percentile - Which stat key this comparison is for.
 * @param current - Current value (ms).
 * @param baseline - Baseline value (ms).
 * @param thresholds - Relative thresholds for severity classification.
 */
export function compareMetric(
  metric: string,
  percentile: ComparisonKey,
  current: number,
  baseline: number,
  thresholds: RelativeThresholds,
): MetricComparison {
  const delta = current - baseline;
  const deltaPercent = baseline === 0 ? 0 : delta / baseline;
  const absDelta = Math.abs(deltaPercent);

  let severity: ComparisonSeverity = COMPARISON_SEVERITY.Pass.value;
  if (delta > 0) {
    if (absDelta >= thresholds.regressionPercent) {
      severity = COMPARISON_SEVERITY.Regression.value;
    } else if (absDelta >= thresholds.warnPercent) {
      severity = COMPARISON_SEVERITY.Warn.value;
    }
  }

  return {
    metric,
    percentile,
    current,
    baseline,
    delta,
    deltaPercent,
    severity,
    indication: iconForSeverity(severity),
  };
}

/**
 * Collects per-metric comparisons of current stats vs baseline (mean, p75, p95).
 *
 * @param results - Current benchmark results (must have p75/p95 maps).
 * @param baselineData - Historical baseline values per metric.
 * @param relativeThresholds - Relative thresholds for traffic lights.
 */
function collectRelativeMetrics(
  results: BenchmarkResults,
  baselineData: Record<string, HistoricalBaselineMetrics>,
  relativeThresholds: RelativeThresholds,
): MetricComparison[] {
  const metrics: MetricComparison[] = [];
  const comparisonKeys: ComparisonKey[] = [
    STAT_KEY.Mean,
    PERCENTILE_KEY.P75,
    PERCENTILE_KEY.P95,
  ];
  for (const key of comparisonKeys) {
    const currentMap = results[key];
    if (!currentMap) {
      continue;
    }
    for (const [metric, currentValue] of Object.entries(currentMap)) {
      const baselineVal = baselineData[metric]?.[key];
      if (baselineVal === undefined) {
        continue;
      }
      metrics.push(
        compareMetric(
          metric,
          key,
          currentValue,
          baselineVal,
          relativeThresholds,
        ),
      );
    }
  }
  return metrics;
}

/**
 * Compares a full benchmark entry against thresholds and baseline.
 *
 * Absolute gate: validates p75/p95 via validateResultThresholds.
 * This decides pass/fail.
 * Relative context: compares p75 and p95 values against historical baseline.
 * Informational only, does not block.
 *
 * @param benchmarkName - Name of the benchmark.
 * @param results - Current benchmark results (must have p75/p95 maps).
 * @param thresholdConfig - Absolute threshold configuration.
 * @param baselineData - Historical baseline values per metric (optional).
 * @param relativeThresholds - Relative thresholds for traffic lights.
 */
export function compareBenchmarkEntries(
  benchmarkName: string,
  results: BenchmarkResults,
  thresholdConfig: ThresholdConfig,
  baselineData?: Record<string, HistoricalBaselineMetrics>,
  relativeThresholds: RelativeThresholds = DEFAULT_RELATIVE_THRESHOLDS,
): BenchmarkEntryComparison {
  const { violations, passed } = validateResultThresholds(
    results,
    thresholdConfig,
  );

  const relativeMetrics =
    baselineData && results.p75
      ? collectRelativeMetrics(results, baselineData, relativeThresholds)
      : [];

  return {
    benchmarkName,
    relativeMetrics,
    absoluteViolations: violations,
    hasRegression: relativeMetrics.some(
      (m) => m.severity === COMPARISON_SEVERITY.Regression.value,
    ),
    hasWarning:
      relativeMetrics.some(
        (m) => m.severity === COMPARISON_SEVERITY.Warn.value,
      ) ||
      violations.some(
        (v: ThresholdViolation) => v.severity === THRESHOLD_SEVERITY.Warn,
      ),
    absoluteFailed: !passed,
  };
}

/**
 * Per-browser multipliers applied uniformly to all P75/P95 threshold values
 * before comparison. Calibrated so that effective fail > p95(P75) across
 * CI runs, targeting <5% false-positive rate on clean PRs.
 *
 * Firefox is ~2× slower than Chrome on multi-step flows; a uniform 2× factor
 * keeps the schema consistent (no per-metric overrides) at the cost of some
 * gate precision on less-divergent metrics.
 */
export const BROWSER_MULTIPLIERS: Readonly<Record<string, number>> = {
  [BENCHMARK_PLATFORMS.FIREFOX]: 2,
};

/**
 * Returns a new `ThresholdConfig` with all P75/P95 values scaled by the
 * per-browser multiplier from `BROWSER_MULTIPLIERS`. `ciMultiplier` is
 * unchanged. Returns `config` unchanged when `browser` is undefined or has
 * no entry in `BROWSER_MULTIPLIERS`.
 *
 * @param config - Base threshold configuration.
 * @param browser - Browser name from the CI artifact (e.g. 'firefox', 'chrome').
 */
export function scaleThresholdsForBrowser(
  config: ThresholdConfig,
  browser?: string,
): ThresholdConfig {
  if (!browser) {
    return config;
  }
  const multiplier = BROWSER_MULTIPLIERS[browser];
  if (!multiplier || multiplier === 1) {
    return config;
  }
  return Object.fromEntries(
    Object.entries(config).map(([metricId, metric]) => {
      // ciMultiplier === 1 (CI_MULTIPLIER.NONE) marks unitless metrics (e.g. CLS).
      // Browser timing multipliers don't apply to dimensionless scores.
      if (metric.ciMultiplier === 1) {
        return [metricId, metric];
      }
      return [
        metricId,
        {
          ...metric,
          ...(metric.p75 && {
            p75: {
              warn: metric.p75.warn * multiplier,
              fail: metric.p75.fail * multiplier,
            },
          }),
          ...(metric.p95 && {
            p95: {
              warn: metric.p95.warn * multiplier,
              fail: metric.p95.fail * multiplier,
            },
          }),
        },
      ];
    }),
  );
}

/**
 * Applies the GATED_METRICS allowlist policy to a comparison entry.
 *
 * THRESHOLD_REGISTRY decides what is a regression; GATED_METRICS decides
 * which regressions block PRs. For each `Fail`-severity violation whose
 * `<benchmarkName>.<metricId>` key is not in `gatedMetrics`, downgrade to
 * `Warn`. `absoluteFailed` and `hasWarning` are recomputed accordingly.
 * `Warn`-severity violations and `relativeMetrics` are never modified.
 *
 * Returns a new comparison object — does not mutate the input.
 *
 * @param comparison - Comparison entry to gate.
 * @param gatedMetrics - Allowlist of dotted gate keys.
 */
export function applyGatingPolicy(
  comparison: BenchmarkEntryComparison,
  gatedMetrics: ReadonlySet<string>,
): BenchmarkEntryComparison {
  const downgraded = comparison.absoluteViolations.map((v) => {
    if (v.severity !== THRESHOLD_SEVERITY.Fail) {
      return v;
    }
    const key = `${comparison.benchmarkName}.${v.metricId}`;
    if (gatedMetrics.has(key)) {
      return v;
    }
    return { ...v, severity: THRESHOLD_SEVERITY.Warn };
  });

  return {
    ...comparison,
    absoluteViolations: downgraded,
    absoluteFailed: downgraded.some(
      (v) => v.severity === THRESHOLD_SEVERITY.Fail,
    ),
    hasWarning:
      comparison.relativeMetrics.some(
        (m) => m.severity === COMPARISON_SEVERITY.Warn.value,
      ) || downgraded.some((v) => v.severity === THRESHOLD_SEVERITY.Warn),
  };
}
