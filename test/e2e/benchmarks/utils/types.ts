import type { TimerResult } from '../../../timers/utils';

type NavigationMetric = {
  load: number;
  domContentLoaded: number;
  domInteractive: number;
  type: string;
};

export type Metrics = {
  navigation: NavigationMetric[];
  paint: Record<string, number>;
  'UI Startup': number;
  'Background Connect': number;
  'First Render': number;
  'Initial Actions': number;
  'Load Scripts': number;
  'Setup Store': number;
  numNetworkReqs: number;
};

export type StatisticalResult = {
  [key: string]: number;
};

export type BenchmarkResults = {
  testTitle?: string;
  persona?: string;
  mean: StatisticalResult;
  min: StatisticalResult;
  max: StatisticalResult;
  stdDev: StatisticalResult;
  p75: StatisticalResult;
  p95: StatisticalResult;
};

/** User action result with testTitle, persona and numeric timing metrics. */
export type UserActionResult = {
  testTitle: string;
  persona?: string;
  [key: string]: string | number | undefined;
};

export type BenchmarkArguments = {
  pages: string[];
  browserLoads: number;
  pageLoads: number;
  out?: string;
  retries: number;
  persona: 'standard' | 'powerUser';
};

export type NetworkReport = {
  numNetworkReqs: number;
};

export type BenchmarkRunResult = {
  timers: TimerResult[];
  success: boolean;
  error?: string;
};

export type TimerStatistics = {
  id: string;
  mean: number;
  min: number;
  max: number;
  stdDev: number;
  cv: number; // Coefficient of Variation
  p50: number;
  p75: number;
  p95: number;
  p99: number;
  samples: number;
  outliers: number;
  dataQuality: 'good' | 'poor' | 'unreliable';
};

/**
 * Threshold limits for a single percentile
 */
export type PercentileThreshold = {
  /** Threshold (ms) that triggers a warning */
  warn: number;
  /** Threshold (ms) that triggers a failure */
  fail: number;
};

/**
 * Configuration for performance thresholds
 * Each metric can have thresholds for P75 and/or P95 values
 */
export type ThresholdConfig = {
  [metricName: string]: {
    /** P75 thresholds - typical user experience */
    p75?: PercentileThreshold;
    /** P95 thresholds - worst-case guardrail */
    p95?: PercentileThreshold;
    /** Multiplier for CI environments (e.g., 1.5 for slower CI machines) */
    ciMultiplier?: number;
  };
};

export type ThresholdViolation = {
  metricId: string;
  percentile: 'p75' | 'p95';
  value: number;
  threshold: number;
  severity: 'warn' | 'fail';
};

export type BenchmarkSummary = {
  name: string;
  iterations: number;
  successfulRuns: number;
  failedRuns: number;
  timers: TimerStatistics[];
  timestamp: string;
  excludedDueToQuality: number;
  /** Whether the exclusion rate is within acceptable limits */
  exclusionRatePassed: boolean;
  /** Percentage of runs that were excluded (0-1) */
  exclusionRate: number;
  /** List of threshold violations (if any thresholds configured) */
  thresholdViolations?: ThresholdViolation[];
  /** Whether all thresholds passed (no 'fail' violations) */
  thresholdsPassed?: boolean;
};

export type PerformanceBenchmarkResults = {
  timestamp: string;
  benchmarks: BenchmarkSummary[];
};

export type BenchmarkFunction = () => Promise<BenchmarkRunResult>;
