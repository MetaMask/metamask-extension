/**
 * Shared benchmark configuration constants and types.
 * These are the single source of truth consumed by:
 * - test/e2e/benchmarks/  (benchmark runner)
 * - development/metamaskbot-build-announce/  (PR comment builder)
 * - .github/workflows/run-benchmarks.yml  (CI matrix — must be updated manually)
 */

export type StatisticalResult = {
  [key: string]: number;
};

export type Persona = 'standard' | 'powerUser';

export type BenchmarkType = 'benchmark' | 'performance' | 'userAction';

/** Web Vitals rating per web.dev thresholds */
export type WebVitalsRating = 'good' | 'needs-improvement' | 'poor';

/**
 * Core Web Vitals metrics from the web-vitals library.
 * INP requires actual user interactions to measure meaningful data.
 */
export type WebVitalsMetrics = {
  /** Interaction to Next Paint in milliseconds */
  inp: number | null;
  /** First Contentful Paint in milliseconds (always available on extension pages) */
  fcp: number | null;
  /** Largest Contentful Paint in milliseconds (null on chrome-extension:// pages) */
  lcp: number | null;
  /** Cumulative Layout Shift (unitless score) */
  cls: number | null;
  /** Rating for INP metric */
  inpRating: WebVitalsRating | null;
  /** Rating for FCP metric */
  fcpRating: WebVitalsRating | null;
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

/** Per-metric statistics (mean, percentiles, etc.) */
export type TimerStatistics = {
  id: string;
  mean: number;
  min: number;
  max: number;
  stdDev: number;
  cv: number;
  p50: number;
  p75: number;
  p95: number;
  p99: number;
  samples: number;
  outliers: number;
  dataQuality: 'good' | 'poor' | 'unreliable';
};

/** Per-metric aggregated web vitals with full statistical analysis */
export type WebVitalsAggregated = {
  inp: TimerStatistics | null;
  fcp: TimerStatistics | null;
  lcp: TimerStatistics | null;
  cls: TimerStatistics | null;
  ratings: {
    inp: RatingDistribution;
    fcp: RatingDistribution;
    lcp: RatingDistribution;
    cls: RatingDistribution;
  };
};

export type WebVitalsRun = WebVitalsMetrics & { iteration: number };

/** Full web vitals summary: per-run snapshots for Sentry spans + aggregated stats */
export type WebVitalsSummary = {
  runs: WebVitalsRun[];
  aggregated: WebVitalsAggregated;
};

export type BenchmarkResults = {
  testTitle: string;
  persona: Persona;
  benchmarkType?: BenchmarkType;
  mean: StatisticalResult;
  min: StatisticalResult;
  max: StatisticalResult;
  stdDev: StatisticalResult;
  p75: StatisticalResult;
  p95: StatisticalResult;
  webVitals?: WebVitalsSummary;
};

export const BENCHMARK_PLATFORMS = {
  CHROME: 'chrome',
  FIREFOX: 'firefox',
} as const;

export const BENCHMARK_BUILD_TYPES = {
  BROWSERIFY: 'browserify',
  WEBPACK: 'webpack',
} as const;

/**
 * Platform and build-type combinations for which entry benchmarks
 * (interaction & user journey) are currently collected.
 * Extend these arrays here to automatically include more combos in
 * both the PR comment builder and the benchmark gate checks.
 */
export const ENTRY_BENCHMARK_PLATFORMS: readonly (typeof BENCHMARK_PLATFORMS)[keyof typeof BENCHMARK_PLATFORMS][] =
  [BENCHMARK_PLATFORMS.CHROME];

export const ENTRY_BENCHMARK_BUILD_TYPES: readonly (typeof BENCHMARK_BUILD_TYPES)[keyof typeof BENCHMARK_BUILD_TYPES][] =
  [BENCHMARK_BUILD_TYPES.BROWSERIFY];
