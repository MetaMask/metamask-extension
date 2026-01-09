/**
 * Statistical utilities for performance benchmarks
 *
 * Includes:
 * - Basic statistics (mean, stdDev, percentiles)
 * - Outlier detection (IQR and z-score methods)
 * - Data quality assessment (CV thresholds)
 * - Sanity checks for metric validation
 */

import type { TimerStatistics } from './types';

// ==================== Configuration ====================

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

// ==================== Basic Statistics ====================

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
  const index = Math.floor((percentile / 100) * sortedValues.length);
  return sortedValues[Math.min(index, sortedValues.length - 1)];
};

// ==================== Outlier Detection ====================

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

// ==================== Sanity Checks ====================

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

// ==================== Main Statistics Calculation ====================

export const calculateTimerStatistics = (
  timerId: string,
  durations: number[],
): TimerStatistics => {
  // Step 1: Apply sanity checks
  const sanityResult = filterBySanityChecks(durations);

  // Step 2: Remove outliers from sanitized data
  const { filtered, outlierCount } = detectOutliers(sanityResult.filtered);
  const sorted = [...filtered].sort((a, b) => a - b);

  // Step 3: Calculate statistics on clean data
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
