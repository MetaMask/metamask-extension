/**
 * Benchmark comparison module.
 *
 * Two-layer approach:
 *
 * 1. Absolute gate: validates p75/p95 against constant limits in THRESHOLD_REGISTRY.
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
  ALL_BENCHMARK_COMBOS,
  PERCENTILE_KEY,
  STAT_KEY,
  THRESHOLD_SEVERITY,
  DEFAULT_RELATIVE_THRESHOLDS,
} from '../../shared/constants/benchmarks';
import { toKebabCase } from '../../shared/lib/string-utils';
import { THRESHOLD_REGISTRY } from '../../test/e2e/benchmarks/utils/constants';
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
  const pct = Number((deltaPercent * 100).toFixed(0));
  if (pct === 0) {
    return '0%';
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

  const relativeMetrics: MetricComparison[] = [];
  if (baselineData && results.p75) {
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
        const baselineEntry = baselineData[metric];
        if (baselineEntry !== undefined) {
          const baselineVal = baselineEntry[key];
          if (baselineVal === undefined) {
            continue;
          }
          relativeMetrics.push(
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
    }
  }

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
 * Resolves the ThresholdConfig for a benchmark by name.
 * Tries direct match, then strips platform/buildType prefixes and converts to
 * kebab-case, then converts the original name to kebab-case.
 *
 * Moved here from compare-benchmarks.ts so library files (performance-benchmarks.ts)
 * do not need to import from the CLI entry point.
 *
 * @param benchmarkName - Benchmark name (e.g. from a JSON filename).
 * @returns The matching ThresholdConfig, or undefined if not registered.
 */
export function resolveThresholdConfig(
  benchmarkName: string,
): ThresholdConfig | undefined {
  if (THRESHOLD_REGISTRY[benchmarkName]) {
    return THRESHOLD_REGISTRY[benchmarkName];
  }

  const prefixes = ALL_BENCHMARK_COMBOS.map(
    (combo) => new RegExp(`^benchmark-${combo}-`, 'u'),
  );
  for (const prefix of prefixes) {
    const stripped = benchmarkName.replace(prefix, '');
    if (stripped !== benchmarkName) {
      if (THRESHOLD_REGISTRY[stripped]) {
        return THRESHOLD_REGISTRY[stripped];
      }
      const strippedKebab = toKebabCase(stripped);
      if (strippedKebab && THRESHOLD_REGISTRY[strippedKebab]) {
        return THRESHOLD_REGISTRY[strippedKebab];
      }
    }
  }

  const kebab = toKebabCase(benchmarkName);
  if (kebab && THRESHOLD_REGISTRY[kebab]) {
    return THRESHOLD_REGISTRY[kebab];
  }

  return undefined;
}
