export type TimerResult = {
  id: string;
  duration: number;
};

export type PageLoadBenchmarkOptions = {
  browserLoads?: number;
  pageLoads?: number;
  retries?: number;
};

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
  /** Web vitals per-run data and aggregated statistics */
  webVitals?: WebVitalsSummary;
};

export type WebVitalsRating = 'good' | 'needs-improvement' | 'poor';

/**
 * Core Web Vitals metrics from the web-vitals library.
 * INP requires actual user interactions to measure meaningful data.
 */
export type WebVitalsMetrics = {
  /** Interaction to Next Paint in milliseconds */
  inp: number | null;
  /** Largest Contentful Paint in milliseconds */
  lcp: number | null;
  /** Cumulative Layout Shift (unitless score) */
  cls: number | null;
  /** Rating for INP metric */
  inpRating: WebVitalsRating | null;
  /** Rating for LCP metric */
  lcpRating: WebVitalsRating | null;
  /** Rating for CLS metric */
  clsRating: WebVitalsRating | null;
};

/** Distribution of rating buckets across benchmark runs */
export type RatingDistribution = {
  good: number;
  'needs-improvement': number;
  poor: number;
  null: number;
};

/** Per-metric aggregated web vitals with full statistical analysis */
export type WebVitalsAggregated = {
  /** Aggregated INP statistics (null if no runs reported INP) */
  inp: TimerStatistics | null;
  /** Aggregated LCP statistics (null if no runs reported LCP) */
  lcp: TimerStatistics | null;
  /** Aggregated CLS statistics (null if no runs reported CLS) */
  cls: TimerStatistics | null;
  /** Rating distribution across all runs */
  ratings: {
    inp: RatingDistribution;
    lcp: RatingDistribution;
    cls: RatingDistribution;
  };
};

export type WebVitalsRun = WebVitalsMetrics & { iteration: number };

/** Full web vitals summary: per-run snapshots for Sentry spans + aggregated stats */
export type WebVitalsSummary = {
  /** Individual per-iteration snapshots — preserved for granular Sentry spans */
  runs: WebVitalsRun[];
  /** Aggregated statistics using outlier detection and percentile analysis */
  aggregated: WebVitalsAggregated;
};

/** User action result with testTitle, persona, timing metrics, and Core Web Vitals. */
export type UserActionResult = {
  testTitle: string;
  persona?: string;
  webVitals?: WebVitalsMetrics;
  [key: string]: string | number | WebVitalsMetrics | undefined;
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
  /** Per-run web vitals snapshot captured at end of measurement */
  webVitals?: WebVitalsMetrics;
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
  /** Web vitals per-run data and aggregated statistics */
  webVitals?: WebVitalsSummary;
};

export type PerformanceBenchmarkResults = {
  timestamp: string;
  benchmarks: BenchmarkSummary[];
};

export type BenchmarkFunction = () => Promise<BenchmarkRunResult>;

/** Return type for user-action measurement functions inside flows */
export type UserActionMeasurement = {
  timers: TimerResult[];
  webVitals?: WebVitalsMetrics;
};
