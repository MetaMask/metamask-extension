/**
 * Benchmark comparison module.
 *
 * Three-layer approach:
 *
 * 1. Absolute gate: validates p75/p95 against constant limits.
 * This is the primary pass/fail authority that prevents performance drift.
 * Reuses validateResultThresholds from the benchmark statistics module.
 *
 * 2. Relative context: compares current values against a historical baseline
 * and computes informational delta % with traffic-light indications.
 * Does NOT affect pass/fail.
 *
 * 3. Statistical significance: Mann-Whitney U test on raw per-run samples.
 * Distinguishes real regressions from CI noise. Informational only —
 * does NOT affect absoluteFailed. Transition to enforcement is a Phase 4 decision.
 * Requires raw per-run samples from both current and baseline (#6946).
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
  PERCENTILE_KEY,
  STAT_KEY,
  THRESHOLD_SEVERITY,
  DEFAULT_RELATIVE_THRESHOLDS,
} from '../../shared/constants/benchmarks';
import { validateResultThresholds } from '../../test/e2e/benchmarks/utils/statistics';
import {
  isSignificantRegression,
  type StatisticalTestResult,
} from '../../test/e2e/benchmarks/utils/mann-whitney';

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

/**
 * Raw per-run samples for a benchmark entry.
 * Keys are metric names (e.g. 'openAccountMenuToAccountListLoaded'),
 * values are arrays of per-run durations in ms.
 * Provided by #6946 — absent until raw sample storage is implemented.
 */
export type PerRunSamples = Record<string, number[]>;

export type BenchmarkEntryComparison = {
  benchmarkName: string;
  relativeMetrics: MetricComparison[];
  absoluteViolations: ThresholdViolation[];
  /** Layer 3: Mann-Whitney U statistical significance tests per metric. */
  statisticalTests?: StatisticalTestResult[];
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
 * Runs Mann-Whitney U tests for each metric that has raw per-run samples
 * in both the current and baseline data.
 *
 * @param currentSamples - Per-run samples from current benchmark run.
 * @param baselineSamples - Per-run samples from historical baseline.
 * @returns Statistical test results per metric.
 */
function collectStatisticalTests(
  currentSamples: PerRunSamples,
  baselineSamples: PerRunSamples,
): StatisticalTestResult[] {
  const results: StatisticalTestResult[] = [];
  for (const [metric, current] of Object.entries(currentSamples)) {
    const baseline = baselineSamples[metric];
    if (!baseline || baseline.length < 2 || current.length < 2) {
      continue;
    }
    results.push(isSignificantRegression(metric, current, baseline));
  }
  return results;
}

/**
 * Compares a full benchmark entry against thresholds and baseline.
 *
 * Layer 1 — Absolute gate: validates p75/p95 via validateResultThresholds.
 * This decides pass/fail.
 * Layer 2 — Relative context: compares current values against historical baseline.
 * Informational only, does not block.
 * Layer 3 — Statistical significance: Mann-Whitney U on raw per-run samples.
 * Informational only, does not affect absoluteFailed.
 *
 * @param benchmarkName - Name of the benchmark.
 * @param results - Current benchmark results (must have p75/p95 maps).
 * @param thresholdConfig - Absolute threshold configuration.
 * @param baselineData - Historical baseline values per metric (optional).
 * @param relativeThresholds - Relative thresholds for traffic lights.
 * @param currentSamples - Raw per-run samples for current run (optional, from #6946).
 * @param baselineSamples - Raw per-run samples from historical baseline (optional, from #6946).
 */
export function compareBenchmarkEntries(
  benchmarkName: string,
  results: BenchmarkResults,
  thresholdConfig: ThresholdConfig,
  baselineData?: Record<string, HistoricalBaselineMetrics>,
  relativeThresholds: RelativeThresholds = DEFAULT_RELATIVE_THRESHOLDS,
  currentSamples?: PerRunSamples,
  baselineSamples?: PerRunSamples,
): BenchmarkEntryComparison {
  const { violations, passed } = validateResultThresholds(
    results,
    thresholdConfig,
  );

  const relativeMetrics =
    baselineData && results.p75
      ? collectRelativeMetrics(results, baselineData, relativeThresholds)
      : [];

  const statisticalTests =
    currentSamples && baselineSamples
      ? collectStatisticalTests(currentSamples, baselineSamples)
      : [];

  return {
    benchmarkName,
    relativeMetrics,
    absoluteViolations: violations,
    statisticalTests,
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
