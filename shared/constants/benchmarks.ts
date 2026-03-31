/**
 * Shared benchmark configuration constants and types.
 */

export type StatisticalResult = {
  [key: string]: number;
};

export const BENCHMARK_PERSONA = {
  STANDARD: 'standard',
  POWER_USER: 'powerUser',
} as const;

export type Persona =
  (typeof BENCHMARK_PERSONA)[keyof typeof BENCHMARK_PERSONA];

export const BENCHMARK_TYPE = {
  BENCHMARK: 'benchmark',
  PERFORMANCE: 'performance',
  USER_ACTION: 'userAction',
} as const;

export type BenchmarkType =
  (typeof BENCHMARK_TYPE)[keyof typeof BENCHMARK_TYPE];

export type BenchmarkResults = {
  testTitle: string;
  persona: Persona;
  benchmarkType?: BenchmarkType;
  platform?: string;
  buildType?: string;
  mean: StatisticalResult;
  min: StatisticalResult;
  max: StatisticalResult;
  stdDev: StatisticalResult;
  p75: StatisticalResult;
  p95: StatisticalResult;
};

export const STAT_KEY = {
  Mean: 'mean',
  StdDev: 'stdDev',
  P75: 'p75',
  P95: 'p95',
} as const;
export type StatKey = (typeof STAT_KEY)[keyof typeof STAT_KEY];

export const PERCENTILE_KEY = {
  P75: STAT_KEY.P75,
  P95: STAT_KEY.P95,
} as const;
export type PercentileKey =
  (typeof PERCENTILE_KEY)[keyof typeof PERCENTILE_KEY];

export type ComparisonKey =
  | PercentileKey
  | typeof STAT_KEY.Mean
  | typeof STAT_KEY.StdDev;

export const THRESHOLD_SEVERITY = {
  Warn: 'warn',
  Fail: 'fail',
} as const;
export type ThresholdSeverity =
  (typeof THRESHOLD_SEVERITY)[keyof typeof THRESHOLD_SEVERITY];

/**
 * Threshold limits for a single percentile.
 * Keys match ThresholdSeverity values (warn, fail).
 */
export type PercentileThreshold = Record<ThresholdSeverity, number>;

/**
 * Configuration for performance thresholds.
 * Each metric can have thresholds for P75 and/or P95 values.
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
  percentile: PercentileKey;
  value: number;
  threshold: number;
  severity: ThresholdSeverity;
};

/**
 * Aggregated historical baseline for a single metric,
 * with values for each stat key (mean, p75, p95).
 */
export type HistoricalBaselineMetrics = Omit<
  Record<StatKey, number>,
  'stdDev'
> & {
  stdDev?: number;
};

export type RelativeThresholds = {
  regressionPercent: number;
  warnPercent: number;
  improvementPercent: number;
};

/**
 * Uniform relative thresholds applied to all metrics.
 * These are informational only (do not affect pass/fail).
 * Per-metric overrides can be set via relativeThresholds in ThresholdConfig.
 */
export const DEFAULT_RELATIVE_THRESHOLDS: RelativeThresholds = {
  regressionPercent: 0.1,
  warnPercent: 0.05,
  improvementPercent: 0.1,
};

export const BENCHMARK_PLATFORMS = {
  CHROME: 'chrome',
  FIREFOX: 'firefox',
} as const;

export const BENCHMARK_BUILD_TYPES = {
  BROWSERIFY: 'browserify',
  WEBPACK: 'webpack',
} as const;

export const ALL_BENCHMARK_COMBOS: readonly string[] = Object.values(
  BENCHMARK_PLATFORMS,
).flatMap((platform) =>
  Object.values(BENCHMARK_BUILD_TYPES).map(
    (buildType) => `${platform}-${buildType}`,
  ),
);

export const ENTRY_BENCHMARK_PLATFORMS: readonly (typeof BENCHMARK_PLATFORMS)[keyof typeof BENCHMARK_PLATFORMS][] =
  [BENCHMARK_PLATFORMS.CHROME];

export const ENTRY_BENCHMARK_BUILD_TYPES: readonly (typeof BENCHMARK_BUILD_TYPES)[keyof typeof BENCHMARK_BUILD_TYPES][] =
  [BENCHMARK_BUILD_TYPES.BROWSERIFY];
