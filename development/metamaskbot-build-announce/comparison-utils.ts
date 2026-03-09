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
} from '../../shared/constants/benchmarks';
import {
  PercentileKey,
  ThresholdSeverity,
  DEFAULT_RELATIVE_THRESHOLDS,
} from '../../shared/constants/benchmarks';
import { validateResultThresholds } from '../../test/e2e/benchmarks/utils/statistics';

export const ComparisonSeverity = {
  Regression: 'regression',
  Warn: 'warn',
  Improvement: 'improvement',
  Neutral: 'neutral',
} as const;
export type ComparisonSeverity =
  (typeof ComparisonSeverity)[keyof typeof ComparisonSeverity];

export const ComparisonDirection = {
  Faster: 'faster',
  Slower: 'slower',
  Same: 'same',
} as const;
export type ComparisonDirection =
  (typeof ComparisonDirection)[keyof typeof ComparisonDirection];

export type MetricComparison = {
  metric: string;
  percentile: PercentileKey;
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
  if (severity === ComparisonSeverity.Regression) {
    return '🔺';
  }
  if (severity === ComparisonSeverity.Improvement) {
    return '🔻';
  }
  if (severity === ComparisonSeverity.Warn) {
    return direction === ComparisonDirection.Slower ? '🔼' : '🔽';
  }
  return '⚪';
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
  const pct = Math.abs(deltaPercent * 100).toFixed(1);
  if (direction === ComparisonDirection.Slower) {
    return `+${pct}%`;
  }
  if (direction === ComparisonDirection.Faster) {
    return `-${pct}%`;
  }
  return '0.0%';
}

function deltaToDirection(delta: number): ComparisonDirection {
  if (delta > 0) {
    return ComparisonDirection.Slower;
  }
  if (delta < 0) {
    return ComparisonDirection.Faster;
  }
  return ComparisonDirection.Same;
}

/**
 * Compares a single metric value against a baseline and returns
 * severity, direction, and traffic-light indication.
 *
 * @param metric - Metric name.
 * @param percentile - Which percentile this comparison is for.
 * @param current - Current value (ms).
 * @param baseline - Baseline value (ms).
 * @param thresholds - Relative thresholds for severity classification.
 */
export function compareMetric(
  metric: string,
  percentile: PercentileKey,
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
    direction === ComparisonDirection.Slower &&
    absDelta >= thresholds.regressionPercent
  ) {
    severity = ComparisonSeverity.Regression;
  } else if (
    direction === ComparisonDirection.Faster &&
    absDelta >= thresholds.improvementPercent
  ) {
    severity = ComparisonSeverity.Improvement;
  } else if (absDelta >= thresholds.warnPercent) {
    severity = ComparisonSeverity.Warn;
  } else {
    severity = ComparisonSeverity.Neutral;
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
    const percentiles = [PercentileKey.P75, PercentileKey.P95] as const;
    for (const percentile of percentiles) {
      const currentMap = results[percentile];
      if (!currentMap) {
        continue;
      }
      for (const [metric, currentValue] of Object.entries(currentMap)) {
        const baselineEntry = baselineData[metric];
        if (baselineEntry !== undefined) {
          relativeMetrics.push(
            compareMetric(
              metric,
              percentile,
              currentValue,
              baselineEntry[percentile],
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
      (m) => m.severity === ComparisonSeverity.Regression,
    ),
    hasWarning:
      relativeMetrics.some((m) => m.severity === ComparisonSeverity.Warn) ||
      violations.some(
        (v: ThresholdViolation) => v.severity === ThresholdSeverity.Warn,
      ),
    absoluteFailed: !passed,
  };
}
