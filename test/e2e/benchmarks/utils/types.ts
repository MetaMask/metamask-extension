import type {
  Persona,
  BenchmarkType,
  WebVitalsMetrics,
  WebVitalsSummary,
  TimerStatistics,
  ThresholdViolation,
} from '../../../../shared/constants/benchmarks';

export type TimerResult = {
  id: string;
  duration: number;
};

export type PageLoadBenchmarkOptions = {
  browserLoads?: number;
  pageLoads?: number;
  retries?: number;
  platform?: string;
  buildType?: string;
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

export type MeasurePageResult = {
  metrics: Metrics[];
  title: string;
  persona: Persona;
  webVitalsRuns?: WebVitalsMetrics[];
};

/** User action result with testTitle, persona, timing metrics, and Core Web Vitals. */
export type UserActionResult = {
  testTitle: string;
  persona: Persona;
  webVitals?: WebVitalsMetrics;
  benchmarkType?: BenchmarkType;
  [key: string]: string | number | WebVitalsMetrics | undefined;
};

export type BenchmarkArguments = {
  pages: string[];
  browserLoads: number;
  pageLoads: number;
  out?: string;
  retries: number;
  persona: Persona;
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
  benchmarkType?: BenchmarkType;
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
  thresholdViolations: ThresholdViolation[];
  thresholdsPassed: boolean;
  /** Benchmark type extracted from the first successful run */
  benchmarkType?: BenchmarkType;
  /** Web vitals per-run data and aggregated statistics */
  webVitals?: WebVitalsSummary;
};

/**
 * Web vitals–style metrics for one Playwright dapp page-load sample (ms unless noted).
 */
export type DappPageLoadMetric = {
  /** Navigation start → load event end */
  pageLoadTime: number;
  domContentLoaded: number;
  firstPaint: number;
  firstContentfulPaint: number;
  largestContentfulPaint: number;
  memoryUsage?: {
    usedJSHeapSize: number;
    totalJSHeapSize: number;
    jsHeapSizeLimit: number;
  };
};

/**
 * One raw measurement from a Playwright dapp page-load benchmark run.
 */
export type DappPageLoadSample = {
  page: string;
  run: number;
  metrics: DappPageLoadMetric;
  timestamp: number;
};

/**
 * Aggregated web-vitals per URL for the Playwright dapp benchmark, using the same
 * {@link TimerStatistics} concept as {@link BenchmarkSummary} (`timers` array).
 * Aggregate with `aggregateDappPageLoadStatistics` in `test/e2e/benchmarks/flows/dapp-page-load/dapp-page-load-stats.ts`,
 * then convert via `dappPageLoadStatsToBenchmarkResults`.
 */
export type DappPageLoadStats = {
  page: string;
  timers: TimerStatistics[];
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
