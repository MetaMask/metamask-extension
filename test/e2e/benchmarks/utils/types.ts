import type {
  BenchmarkResults,
  Persona,
  BenchmarkType,
  WebVitalsMetrics,
  WebVitalsSummary,
  TimerStatistics,
  ThresholdViolation,
} from '../../../../shared/constants/benchmarks';

export type TimerResult = {
  id: string;
  /** Numeric value: duration in ms, or a count when unit is 'count'. */
  value: number;
  /** Defaults to 'ms'. Non-duration entries (e.g. counts) use 'count'. */
  unit?: 'ms' | 'count';
};

export type LongTaskStepResult = {
  /** The step id. The step's timer is reported as `<id>Legacy`. */
  id: string;
  duration: number;
  longTaskCount: number;
  longTaskTotalDuration: number;
  longTaskMaxDuration: number;
  tbt: number;
  /**
   * Whether the `longtask` observer was attached for this step. False means the
   * four counts above are initialised zeros rather than observations.
   */
  longTasksObserved: boolean;
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
  longTaskCount?: number;
  longTaskTotalDuration?: number;
  longTaskMaxDuration?: number;
  tbt?: number;
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
  /**
   * Distinct failure reasons, set only when every iteration failed. Without
   * it a benchmark whose iterations all threw is indistinguishable in the
   * artifact from one that ran clean: the statistics are simply empty.
   */
  iterationErrors?: string[];
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
 * Test-side reads of one dapp page load, kept beside the series and in none
 * of them: what a known-answer lever on the test dapp's `main.js` did on that
 * load. Each is null when the page recorded no entry for it.
 */
export type DappPageLoadProbe = {
  /** Duration of the known-answer busy-wait's `performance.measure`, in ms. */
  scriptWorkMs: number | null;
  /** `main.js`'s resource timing `startTime`, in ms from navigation start. */
  scriptStartTime: number | null;
  /** `main.js`'s resource timing `responseEnd`, in ms from navigation start. */
  scriptResponseEnd: number | null;
  /**
   * Long tasks started before `loadEventEnd`. `main.js`'s evaluation is one, so
   * 0 means the read saw none, not that the page had none. Null when the
   * browser does not support `longtask` entries.
   */
  longTaskCount: number | null;
  /**
   * The long tasks that started at or after the busy-wait's measure ended
   * and before `loadEventEnd`: work the busy-wait may have pushed into the
   * measured interval. Each is null when the page recorded no measure.
   */
  afterWorkLongTaskCount: number | null;
  /** Their summed durations, in ms. */
  afterWorkLongTaskTotalMs: number | null;
  /** The longest of them, in ms, or 0 when there were none. */
  afterWorkLongTaskLongestMs: number | null;
};

/**
 * One raw measurement from a Playwright dapp page-load benchmark run.
 */
export type DappPageLoadSample = {
  page: string;
  run: number;
  metrics: DappPageLoadMetric;
  /** Test-side reads of the load, outside `metrics` so no series changes. */
  probe?: DappPageLoadProbe;
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

/**
 * One page load's {@link DappPageLoadProbe}, under its run number, as the
 * dapp page-load artifact carries it.
 */
export type DappPageLoadProbeEntry = DappPageLoadProbe & { iteration: number };

/**
 * A dapp page-load run's test-side reads: its samples, each carrying its
 * probe, and the service workers the browser context listed once the
 * extension loaded (null when not read).
 */
export type DappPageLoadProbeReads = {
  samples: DappPageLoadSample[];
  serviceWorkers: number | null;
};

/**
 * The dapp page-load artifact's block: the series' results, plus the
 * test-side reads beside `values`, which enter no statistic.
 */
export type DappPageLoadBenchmarkResults = BenchmarkResults & {
  /** Every page load's probe, warm-up included, in run order. */
  probe: DappPageLoadProbeEntry[];
  /** Service workers the browser context listed once the extension loaded. */
  serviceWorkers: number | null;
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
