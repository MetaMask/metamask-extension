/**
 * Statistical utilities for performance benchmarks
 *
 * Includes:
 * - Basic statistics (mean, stdDev, percentiles)
 * - Outlier detection (IQR and z-score methods)
 * - Data quality assessment (CV thresholds)
 * - Sanity checks for metric validation
 */

import type {
  PercentileThreshold,
  RatingDistribution,
  StatisticalResult,
  ThresholdConfig,
  ThresholdViolation,
  TimerStatistics,
  WebVitalsAggregated,
  WebVitalsMetrics,
  WebVitalsRating,
} from './types';

/**
 * CV (Coefficient of Variation) thresholds for data quality assessment
 * CV = (stdDev / mean) * 100
 */
export const CV_THRESHOLDS = {
  GOOD: 30, // < 30%: consistent data
  POOR: 50, // 30-50%: flag as poor
  // > 50%: unreliable - measurement is fundamentally unstable
} as const;

/**
 * Z-score threshold for outlier detection
 * Values with |z-score| > threshold are considered outliers
 */
export const Z_SCORE_THRESHOLD = 3;

/**
 * Maximum allowed duration (ms) - metrics exceeding this are excluded
 * Default: 2 minutes (reasonable timeout for most UI operations)
 */
export const MAX_METRIC_DURATION_MS = 120_000;

/**
 * Minimum allowed duration (ms) - metrics below this are suspicious
 * Default: 1ms (anything lower is likely a measurement error)
 */
export const MIN_METRIC_DURATION_MS = 1;

/**
 * Maximum percentage of excluded runs before failing the benchmark
 */
export const MAX_EXCLUSION_RATE = 0.5; // 50%

export const calculateMean = (values: number[]): number => {
  if (values.length === 0) {
    return 0;
  }
  return values.reduce((sum, val) => sum + val, 0) / values.length;
};

export const calculateStdDev = (values: number[]): number => {
  if (values.length <= 1) {
    return 0;
  }
  const mean = calculateMean(values);
  const squaredDiffs = values.map((val) => Math.pow(val - mean, 2));
  return Math.sqrt(calculateMean(squaredDiffs));
};

export const calculatePercentile = (
  sortedValues: number[],
  percentile: number,
): number => {
  if (sortedValues.length === 0) {
    return 0;
  }
  if (percentile <= 0) {
    return sortedValues[0];
  }
  if (percentile >= 100) {
    return sortedValues[sortedValues.length - 1];
  }
  const rank = Math.ceil((percentile / 100) * sortedValues.length);
  const index = Math.min(Math.max(rank - 1, 0), sortedValues.length - 1);
  return sortedValues[index];
};

/**
 * Higher-order function to apply a calculation across all metrics in a result object
 * Used by page-load benchmarks to transform Record<string, number[]> to StatisticalResult
 *
 * @param calc - Calculation function to apply to each metric array
 */
export function calculateResult(calc: (array: number[]) => number) {
  return (result: Record<string, number[]>): StatisticalResult => {
    const calculatedResult: StatisticalResult = {};
    for (const key of Object.keys(result)) {
      if (result[key].length > 0) {
        calculatedResult[key] = calc(result[key]);
      }
    }
    return calculatedResult;
  };
}

export const calcMinResult = calculateResult((array: number[]) =>
  Math.min(...array),
);
export const calcMaxResult = calculateResult((array: number[]) =>
  Math.max(...array),
);
export const calcMeanResult = calculateResult((array: number[]) =>
  calculateMean(array),
);
export const calcStdDevResult = calculateResult((array: number[]) =>
  calculateStdDev(array),
);

export function calcPResult(
  array: Record<string, number[]>,
  p: number,
): StatisticalResult {
  return calculateResult((arr: number[]) => {
    const sorted = [...arr].sort((a, b) => a - b);
    return calculatePercentile(sorted, p);
  })(array);
}

/**
 * Calculate z-score for a value given mean and standard deviation
 * z = (x - mean) / stdDev
 *
 * @param value - The value to calculate z-score for
 * @param mean - The mean of the distribution
 * @param stdDev - The standard deviation of the distribution
 */
export const calculateZScore = (
  value: number,
  mean: number,
  stdDev: number,
): number => {
  if (stdDev === 0) {
    return 0;
  }
  return (value - mean) / stdDev;
};

/**
 * Detect outliers using z-score method
 * Values with |z-score| > threshold are considered outliers
 *
 * @param values - Array of values to check for outliers
 * @param threshold - Z-score threshold for outlier detection
 */
export const detectOutliersZScore = (
  values: number[],
  threshold: number = Z_SCORE_THRESHOLD,
): { filtered: number[]; outlierCount: number; outliers: number[] } => {
  if (values.length < 3) {
    return { filtered: values, outlierCount: 0, outliers: [] };
  }

  const mean = calculateMean(values);
  const stdDev = calculateStdDev(values);

  const outliers: number[] = [];
  const filtered = values.filter((v) => {
    const zScore = Math.abs(calculateZScore(v, mean, stdDev));
    if (zScore > threshold) {
      outliers.push(v);
      return false;
    }
    return true;
  });

  return { filtered, outlierCount: outliers.length, outliers };
};

/**
 * Detect outliers using IQR (Interquartile Range) method
 * Values outside [Q1 - 1.5*IQR, Q3 + 1.5*IQR] are considered outliers
 *
 * @param values - Array of values to check for outliers
 */
export const detectOutliersIQR = (
  values: number[],
): { filtered: number[]; outlierCount: number; outliers: number[] } => {
  if (values.length < 4) {
    return { filtered: values, outlierCount: 0, outliers: [] };
  }

  const sorted = [...values].sort((a, b) => a - b);
  const q1 = calculatePercentile(sorted, 25);
  const q3 = calculatePercentile(sorted, 75);
  const iqr = q3 - q1;
  const lowerBound = q1 - 1.5 * iqr;
  const upperBound = q3 + 1.5 * iqr;

  const outliers: number[] = [];
  const filtered = values.filter((v) => {
    if (v < lowerBound || v > upperBound) {
      outliers.push(v);
      return false;
    }
    return true;
  });

  return { filtered, outlierCount: outliers.length, outliers };
};

/**
 * Combined outlier detection using both IQR and z-score methods
 * A value is only kept if it passes both methods
 *
 * @param values - Array of values to check for outliers
 */
export const detectOutliers = (
  values: number[],
): { filtered: number[]; outlierCount: number } => {
  const iqrResult = detectOutliersIQR(values);
  const zScoreResult = detectOutliersZScore(iqrResult.filtered);

  return {
    filtered: zScoreResult.filtered,
    outlierCount: iqrResult.outlierCount + zScoreResult.outlierCount,
  };
};

// ==================== Data Quality Assessment ====================

/**
 * Determine data quality based on Coefficient of Variation (CV)
 * CV = (stdDev / mean) * 100
 *
 * @param cv - Coefficient of variation value
 */
export const assessDataQuality = (
  cv: number,
): 'good' | 'poor' | 'unreliable' => {
  if (cv < CV_THRESHOLDS.GOOD) {
    return 'good';
  }
  if (cv < CV_THRESHOLDS.POOR) {
    return 'poor';
  }
  return 'unreliable';
};

export type SanityCheckResult = {
  valid: boolean;
  reason?: string;
};

/**
 * Validate a single metric value against sanity checks
 *
 * @param value - The metric value to validate
 * @param maxDuration - Maximum allowed duration in milliseconds
 * @param minDuration - Minimum allowed duration in milliseconds
 */
export const validateMetricValue = (
  value: number,
  maxDuration: number = MAX_METRIC_DURATION_MS,
  minDuration: number = MIN_METRIC_DURATION_MS,
): SanityCheckResult => {
  // Check for zero or negative values
  if (value <= 0) {
    return { valid: false, reason: 'Metric is zero or negative' };
  }

  // Check for suspiciously small values
  if (value < minDuration) {
    return {
      valid: false,
      reason: `Metric below minimum threshold (${minDuration}ms)`,
    };
  }

  // Check for values exceeding timeout
  if (value > maxDuration) {
    return {
      valid: false,
      reason: `Metric exceeds maximum threshold (${maxDuration}ms)`,
    };
  }

  return { valid: true };
};

/**
 * Filter metrics by sanity checks and return valid values
 *
 * @param values - Array of metric values to filter
 * @param maxDuration - Maximum allowed duration in milliseconds
 * @param minDuration - Minimum allowed duration in milliseconds
 */
export const filterBySanityChecks = (
  values: number[],
  maxDuration: number = MAX_METRIC_DURATION_MS,
  minDuration: number = MIN_METRIC_DURATION_MS,
): { filtered: number[]; excludedCount: number; reasons: string[] } => {
  const filtered: number[] = [];
  const reasons: string[] = [];
  let excludedCount = 0;

  for (const value of values) {
    const result = validateMetricValue(value, maxDuration, minDuration);
    if (result.valid) {
      filtered.push(value);
    } else {
      excludedCount += 1;
      if (result.reason) {
        reasons.push(result.reason);
      }
    }
  }

  return { filtered, excludedCount, reasons };
};

export const calculateTimerStatistics = (
  timerId: string,
  durations: number[],
): TimerStatistics => {
  const sanityResult = filterBySanityChecks(durations);
  const { filtered, outlierCount } = detectOutliers(sanityResult.filtered);
  const sorted = [...filtered].sort((a, b) => a - b);
  const mean = calculateMean(filtered);
  const stdDev = calculateStdDev(filtered);
  const cv = mean > 0 ? (stdDev / mean) * 100 : 0;

  const totalExcluded = sanityResult.excludedCount + outlierCount;

  return {
    id: timerId,
    mean,
    min: sorted.length > 0 ? sorted[0] : 0,
    max: sorted.length > 0 ? sorted[sorted.length - 1] : 0,
    stdDev,
    cv,
    p50: calculatePercentile(sorted, 50),
    p75: calculatePercentile(sorted, 75),
    p95: calculatePercentile(sorted, 95),
    p99: calculatePercentile(sorted, 99),
    samples: filtered.length,
    outliers: totalExcluded,
    dataQuality: assessDataQuality(cv),
  };
};

/**
 * Check if too many runs were excluded (indicates systemic issues)
 *
 * @param totalRuns - Total number of benchmark runs
 * @param excludedRuns - Number of runs that were excluded
 * @param maxRate - Maximum allowed exclusion rate (0-1)
 */
export const checkExclusionRate = (
  totalRuns: number,
  excludedRuns: number,
  maxRate: number = MAX_EXCLUSION_RATE,
): { passed: boolean; rate: number } => {
  const rate = totalRuns > 0 ? excludedRuns / totalRuns : 0;
  return {
    passed: rate <= maxRate,
    rate,
  };
};

// ==================== Threshold Validation ====================

/**
 * Check if running in CI environment
 */
export const isCI = (): boolean => {
  return Boolean(process.env.CI);
};

/**
 * Get the effective threshold value, applying CI multiplier if in CI environment
 *
 * @param baseThreshold - The base threshold value in milliseconds
 * @param ciMultiplier - Optional multiplier for CI environments (default: 1.0)
 */
export const getEffectiveThreshold = (
  baseThreshold: number,
  ciMultiplier?: number,
): number => {
  if (isCI() && ciMultiplier && ciMultiplier > 0) {
    return baseThreshold * ciMultiplier;
  }
  return baseThreshold;
};

/**
 * Validate a single percentile value against thresholds
 *
 * @param metricId - The metric identifier
 * @param percentile - Which percentile ('p75' or 'p95')
 * @param value - The actual percentile value
 * @param thresholds - The threshold configuration for this percentile
 * @param ciMultiplier - Optional CI multiplier
 */
const validatePercentile = (
  metricId: string,
  percentile: 'p75' | 'p95',
  value: number,
  thresholds: PercentileThreshold,
  ciMultiplier?: number,
): ThresholdViolation | null => {
  const warnThreshold = getEffectiveThreshold(thresholds.warn, ciMultiplier);
  const failThreshold = getEffectiveThreshold(thresholds.fail, ciMultiplier);

  // Check fail threshold first (more severe)
  if (value > failThreshold) {
    return {
      metricId,
      percentile,
      value,
      threshold: failThreshold,
      severity: 'fail',
    };
  }

  // Check warn threshold
  if (value > warnThreshold) {
    return {
      metricId,
      percentile,
      value,
      threshold: warnThreshold,
      severity: 'warn',
    };
  }

  return null;
};

/**
 * Validate a single timer's statistics against configured thresholds
 * Checks both P75 and P95 if configured
 *
 * @param stats - The timer statistics to validate
 * @param thresholds - Threshold configuration for this metric
 */
export const validateTimerThreshold = (
  stats: TimerStatistics,
  thresholds: ThresholdConfig[string],
): ThresholdViolation[] => {
  const violations: ThresholdViolation[] = [];

  // Check P75 thresholds if configured
  if (thresholds.p75) {
    const violation = validatePercentile(
      stats.id,
      'p75',
      stats.p75,
      thresholds.p75,
      thresholds.ciMultiplier,
    );
    if (violation) {
      violations.push(violation);
    }
  }

  // Check P95 thresholds if configured
  if (thresholds.p95) {
    const violation = validatePercentile(
      stats.id,
      'p95',
      stats.p95,
      thresholds.p95,
      thresholds.ciMultiplier,
    );
    if (violation) {
      violations.push(violation);
    }
  }

  return violations;
};

/**
 * Validate all timer statistics against configured thresholds
 *
 * @param timerStats - Array of timer statistics
 * @param thresholdConfig - Threshold configuration for metrics
 * @returns Object containing violations array and whether all thresholds passed
 */
export const validateThresholds = (
  timerStats: TimerStatistics[],
  thresholdConfig: ThresholdConfig,
): { violations: ThresholdViolation[]; passed: boolean } => {
  const violations: ThresholdViolation[] = [];

  for (const stats of timerStats) {
    const thresholds = thresholdConfig[stats.id];

    // Skip metrics without configured thresholds
    if (!thresholds) {
      continue;
    }

    // Skip unreliable data - don't validate against thresholds
    if (stats.dataQuality === 'unreliable') {
      continue;
    }

    const timerViolations = validateTimerThreshold(stats, thresholds);
    violations.push(...timerViolations);
  }

  // Passed if no 'fail' severity violations
  const passed = !violations.some((v) => v.severity === 'fail');

  return { violations, passed };
};

/**
 * Format threshold violations into human-readable messages
 *
 * @param violations - Array of threshold violations
 */
export const formatThresholdViolations = (
  violations: ThresholdViolation[],
): string[] => {
  return violations.map((v) => {
    const severityPrefix = v.severity === 'fail' ? '❌ FAIL' : '⚠️ WARN';
    const percentileLabel = v.percentile.toUpperCase();
    return `${severityPrefix}: ${v.metricId} ${percentileLabel} (${v.value.toFixed(2)}ms) exceeds threshold (${v.threshold.toFixed(2)}ms)`;
  });
};

const WEB_VITALS_NUMERIC_KEYS = ['inp', 'lcp', 'cls'] as const;

type WebVitalsNumericKey = (typeof WEB_VITALS_NUMERIC_KEYS)[number];

/**
 * Per-metric sanity bounds for web vitals.
 *
 * These differ from timer bounds because:
 * - CLS is unitless (0-10 range in practice), not milliseconds
 * - CLS of 0 is valid (perfect visual stability)
 * - INP/LCP have different reasonable ceilings than arbitrary timer durations
 */
const WEB_VITALS_BOUNDS: Record<
  WebVitalsNumericKey,
  { min: number; max: number; allowZero: boolean }
> = {
  /** INP: interaction responsiveness. Google "poor" starts at 500ms. */
  inp: { min: 1, max: 30_000, allowZero: false },
  /** LCP: perceived load time. Google "poor" starts at 4s. */
  lcp: { min: 1, max: 60_000, allowZero: false },
  /** CLS: layout shift score (unitless). 0 is perfect; >1 is extremely poor. */
  cls: { min: 0, max: 10, allowZero: true },
};

/**
 * Calculate statistics for a single web vitals metric.
 *
 * Uses metric-specific sanity bounds, then the same IQR+z-score outlier
 * detection and percentile analysis as timer statistics.
 *
 * @param metricId - The metric name ('inp', 'lcp', or 'cls')
 * @param values - Raw metric values across benchmark iterations
 */
export const calculateWebVitalsStatistics = (
  metricId: WebVitalsNumericKey,
  values: number[],
): TimerStatistics => {
  const bounds = WEB_VITALS_BOUNDS[metricId];

  // Metric-specific sanity filtering
  const filtered: number[] = [];
  let excludedCount = 0;
  for (const value of values) {
    const tooLow = bounds.allowZero ? value < bounds.min : value <= bounds.min;
    if (tooLow || value > bounds.max) {
      excludedCount += 1;
    } else {
      filtered.push(value);
    }
  }

  // Standard outlier detection on surviving values
  const outlierResult = detectOutliers(filtered);
  const sorted = [...outlierResult.filtered].sort((a, b) => a - b);
  const mean = calculateMean(outlierResult.filtered);
  const stdDev = calculateStdDev(outlierResult.filtered);
  const cv = mean > 0 ? (stdDev / mean) * 100 : 0;

  const totalExcluded = excludedCount + outlierResult.outlierCount;

  return {
    id: metricId,
    mean,
    min: sorted.length > 0 ? sorted[0] : 0,
    max: sorted.length > 0 ? sorted[sorted.length - 1] : 0,
    stdDev,
    cv,
    p50: calculatePercentile(sorted, 50),
    p75: calculatePercentile(sorted, 75),
    p95: calculatePercentile(sorted, 95),
    p99: calculatePercentile(sorted, 99),
    samples: outlierResult.filtered.length,
    outliers: totalExcluded,
    dataQuality: assessDataQuality(cv),
  };
};

function createEmptyRatingDistribution(): RatingDistribution {
  return { good: 0, 'needs-improvement': 0, poor: 0, null: 0 };
}

/**
 * Aggregate per-run web vitals into statistical summaries.
 *
 * Uses metric-specific sanity bounds (CLS is unitless, INP/LCP have different
 * ceilings than generic timer durations), then standard outlier detection and
 * percentile analysis. Preserves rating distributions for categorical analysis.
 *
 * @param runs - Array of per-run web vitals snapshots
 * @returns Aggregated statistics per metric + rating distributions
 */
export function aggregateWebVitals(
  runs: WebVitalsMetrics[],
): WebVitalsAggregated {
  const result: WebVitalsAggregated = {
    inp: null,
    lcp: null,
    cls: null,
    ratings: {
      inp: createEmptyRatingDistribution(),
      lcp: createEmptyRatingDistribution(),
      cls: createEmptyRatingDistribution(),
    },
  };

  for (const metric of WEB_VITALS_NUMERIC_KEYS) {
    // Extract non-null numeric values for statistical analysis
    const values = runs
      .map((r) => r[metric])
      .filter((v): v is number => v !== null);

    if (values.length > 0) {
      result[metric] = calculateWebVitalsStatistics(metric, values);
    }

    // Tally rating distribution across all runs
    const ratingKey = `${metric}Rating` as const;
    for (const run of runs) {
      const rating: WebVitalsRating | null = run[ratingKey];
      if (rating === null) {
        result.ratings[metric].null += 1;
      } else {
        result.ratings[metric][rating] += 1;
      }
    }
  }

  return result;
}
