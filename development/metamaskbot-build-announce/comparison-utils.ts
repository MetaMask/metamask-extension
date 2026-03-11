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

export const COMPARISON_SEVERITY = {
  Regression: 'regression',
  Warn: 'warn',
  Improvement: 'improvement',
  Neutral: 'neutral',
} as const;
export type ComparisonSeverity =
  (typeof COMPARISON_SEVERITY)[keyof typeof COMPARISON_SEVERITY];

export const COMPARISON_DIRECTION = {
  Faster: 'faster',
  Slower: 'slower',
  Same: 'same',
} as const;
export type ComparisonDirection =
  (typeof COMPARISON_DIRECTION)[keyof typeof COMPARISON_DIRECTION];

export type MetricComparison = {
  metric: string;
  percentile: ComparisonKey;
  current: number;
  baseline: number;
  delta: number;
  deltaPercent: number;
  direction: ComparisonDirection;
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

/**
 * Returns a traffic-light indication based on comparison severity + direction.
 *
 * @param severity - The comparison severity.
 * @param direction - The comparison direction.
 */
export function getTrafficLightIndication(
  severity: ComparisonSeverity,
  direction: ComparisonDirection,
): string {
  if (severity === COMPARISON_SEVERITY.Regression) {
    return direction === COMPARISON_DIRECTION.Slower ? '🔺' : '🔻';
  }
  if (severity === COMPARISON_SEVERITY.Warn) {
    return direction === COMPARISON_DIRECTION.Slower ? '🟡⬆️' : '🟡⬇️';
  }
  if (severity === COMPARISON_SEVERITY.Improvement) {
    return direction === COMPARISON_DIRECTION.Faster ? '🟢⬇️' : '🟢⬆️';
  }
  return '➡️';
}

/**
 * Formats a delta percentage as a human-readable string.
 *
 * @param deltaPercent - Delta as a fraction (0.1 = 10%).
 * @param direction - Direction of the change.
 */
export function formatDeltaPercent(
  deltaPercent: number,
  direction: ComparisonDirection,
): string {
  const pct = Math.abs(deltaPercent * 100).toFixed(0);
  if (direction === COMPARISON_DIRECTION.Slower) {
    return `+${pct}%`;
  }
  if (direction === COMPARISON_DIRECTION.Faster) {
    return `-${pct}%`;
  }
  return '0%';
}

function deltaToDirection(delta: number): ComparisonDirection {
  if (delta > 0) {
    return COMPARISON_DIRECTION.Slower;
  }
  if (delta < 0) {
    return COMPARISON_DIRECTION.Faster;
  }
  return COMPARISON_DIRECTION.Same;
}

/**
 * Compares a single metric value against a baseline and returns
 * severity, direction, and traffic-light indication.
 *
 * @param metric - Metric name.
 * @param percentile - Which stat key this comparison is for ('mean', 'p75', or 'p95').
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

  const direction = deltaToDirection(delta);

  let severity: ComparisonSeverity;
  const absDelta = Math.abs(deltaPercent);

  if (
    direction === COMPARISON_DIRECTION.Slower &&
    absDelta >= thresholds.regressionPercent
  ) {
    severity = COMPARISON_SEVERITY.Regression;
  } else if (
    direction === COMPARISON_DIRECTION.Faster &&
    absDelta >= thresholds.improvementPercent
  ) {
    severity = COMPARISON_SEVERITY.Improvement;
  } else if (absDelta >= thresholds.warnPercent) {
    severity = COMPARISON_SEVERITY.Warn;
  } else {
    severity = COMPARISON_SEVERITY.Neutral;
  }

  return {
    metric,
    percentile,
    current,
    baseline,
    delta,
    deltaPercent,
    direction,
    severity,
    indication: getTrafficLightIndication(severity, direction),
  };
}

type BaselineMetrics = {
  mean: number;
  p75: number;
  p95: number;
};

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
  baselineData?: Record<string, BaselineMetrics>,
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
          relativeMetrics.push(
            compareMetric(
              metric,
              key,
              currentValue,
              baselineEntry[key],
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
      (m) => m.severity === COMPARISON_SEVERITY.Regression,
    ),
    hasWarning:
      relativeMetrics.some((m) => m.severity === COMPARISON_SEVERITY.Warn) ||
      violations.some(
        (v: ThresholdViolation) => v.severity === THRESHOLD_SEVERITY.Warn,
      ),
    absoluteFailed: !passed,
  };
}
