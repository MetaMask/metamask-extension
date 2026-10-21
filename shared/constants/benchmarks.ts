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
  trimmedCount?: number;
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

/** Summary of one in-browser calibration metric across its samples. */
export type CalibrationStatistic = {
  mean: number;
  median: number;
  p90: number;
};

/**
 * The in-browser calibration probe's summary, taken before the benchmark ran.
 * The raw per-sample artifact is `runner-calibration-*.json`; this is the part
 * a result carries so it can be analysed without the sibling file.
 */
export type HostCalibration = {
  sampleCount: number;
  metrics: Record<string, CalibrationStatistic>;
  /** The browser the calibration session actually launched. */
  browser?: HostBrowser;
};

/** Versions reported by the calibration's WebDriver session. */
export type HostBrowser = {
  name?: string;
  version?: string;
  driverVersion?: string;
};

/**
 * The machine one result was measured on.
 *
 * A runner pool is not homogeneous, so without this a slow machine is
 * indistinguishable from slow code. Fields are undefined when the provider does
 * not expose them; undefined means "unknown", never "zero".
 */
export type HostProvenance = {
  /** ISO 8601 UTC time the result was assembled, for time-of-day analysis. */
  capturedAt?: string;
  provider?: 'github' | 'namespace';
  /** The `runs-on` value the job requested, from `BENCHMARK_RUNNER_LABEL`. */
  label?: string;
  /** Runner name. High-cardinality; keep it out of queryable Sentry fields. */
  name?: string;
  /** Namespace instance ID. */
  instanceId?: string;
  /** Namespace instance shape, e.g. `8x16`. GitHub does not expose a shape. */
  shape?: string;
  /** Cloud region or zone, where the provider exposes it. */
  region?: string;
  /** Provider-specific placement, e.g. Namespace storage/cluster regions. */
  placement?: Record<string, string>;
  os?: string;
  arch?: string;
  /** GitHub-hosted runner image OS and version (`ImageOS`, `ImageVersion`). */
  imageOs?: string;
  imageVersion?: string;
  /** `process.version` of the benchmark process. */
  nodeVersion?: string;
  /** First line of `anvil --version`; undefined if the binary is missing. */
  anvilVersion?: string;
  cpuModel?: string;
  /**
   * From the first `/proc/cpuinfo` block. Tells CPU generations apart where the
   * model name is generic (Namespace reports only "AMD EPYC").
   */
  cpuFamily?: number;
  cpuModelNumber?: number;
  cpuStepping?: number;
  cpuMicrocode?: string;
  cpuCount?: number;
  /** Undefined on Linux VMs, where `os.cpus()[0].speed` reports 0. */
  cpuSpeedMhz?: number;
  totalMemMb?: number;
  /**
   * Hypervisor CPU steal as a percentage of CPU time over this result's own
   * window. A virtualization platform that does not report steal reads 0 here,
   * so 0 is not evidence that the machine was uncontended.
   */
  stealPercent?: number;
  /** Node-process sha256 probe median in ms, taken before the benchmark ran. */
  nodeProbeBeforeMs?: number;
  /** Same probe, taken after the measurements finished. */
  nodeProbeAfterMs?: number;
  calibration?: HostCalibration;
};

/**
 * Which source and build one result describes. The commit under test depends
 * on the event, and the binary can come from a donor run whose source hash
 * matched, so the PR head SHA alone does not identify what was measured.
 */
export type SourceProvenance = {
  /** `GITHUB_EVENT_NAME`. */
  event?: string;
  /** `GITHUB_SHA`: the merge commit for pull_request events, else the pushed commit. */
  eventSha?: string;
  /** The PR head commit (`HEAD_COMMIT_HASH`); the commit that Sentry labels use. */
  headSha?: string;
  /** `pull_request.base.sha`: the base tip when the event fired. */
  baseSha?: string;
  /** Run that produced the binary under test; differs from this run when reused. */
  buildFromRun?: string;
  /** Head SHA of the run that produced the binary. */
  buildFromSha?: string;
  /** Build-source hash that qualified the donor build for reuse. */
  buildSourceHash?: string;
};

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
  trimmedCount?: StatisticalResult;
  outliers?: StatisticalResult;
  /**
   * Raw per-load values by metric, in collection order, before any outlier
   * trimming. Artifact only: not sent to Sentry.
   */
  samples?: Record<string, number[]>;
  host?: HostProvenance;
  source?: SourceProvenance;
  webVitals?: WebVitalsSummary;
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
  /**
   * Multiplicative factor applied to the base threshold because the observed
   * CV for this metric fell in the adaptive-widening band (25% ≤ CV ≤ 50%).
   * Undefined when no CV adjustment was applied. The `threshold` field above
   * already carries the fully-adjusted (CI × CV) effective value; this factor
   * lets downstream consumers recover the pre-widening threshold if needed.
   */
  cvAdjustment?: number;
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
};

/**
 * Uniform relative thresholds applied to all metrics.
 * These are informational only (do not affect pass/fail).
 * Per-metric overrides can be set via relativeThresholds in ThresholdConfig.
 */
export const DEFAULT_RELATIVE_THRESHOLDS: RelativeThresholds = {
  regressionPercent: 0.1,
  warnPercent: 0.05,
};

export const BENCHMARK_PLATFORMS = {
  CHROME: 'chrome',
  FIREFOX: 'firefox',
} as const;

export const BENCHMARK_BUILD_TYPES = {
  WEBPACK: 'webpack',
} as const;

export const ALL_BENCHMARK_COMBOS: readonly string[] = Object.values(
  BENCHMARK_PLATFORMS,
).flatMap((platform) =>
  Object.values(BENCHMARK_BUILD_TYPES).map(
    (buildType) => `${platform}-${buildType}`,
  ),
);

export const DEFAULT_BENCHMARK_ITERATIONS = 5;

export const DEFAULT_BENCHMARK_BROWSER_LOADS = 10;
export const DEFAULT_BENCHMARK_PAGE_LOADS = 10;

export const DEFAULT_BENCHMARK_LOAD_MATRIX_SAMPLE_COUNT =
  DEFAULT_BENCHMARK_BROWSER_LOADS * DEFAULT_BENCHMARK_PAGE_LOADS;

export type BenchmarkAnnounceSamples = {
  sampleQuantity: number;
};

export type BenchmarkAnnounceSection = {
  title: string;
  announceSamples: BenchmarkAnnounceSamples;
};

export const BENCHMARK_ANNOUNCE_SECTIONS = {
  interaction: {
    title: 'Interaction Benchmarks',
    announceSamples: {
      sampleQuantity: DEFAULT_BENCHMARK_ITERATIONS,
    },
  },
  startup: {
    title: 'Startup Benchmarks',
    announceSamples: {
      sampleQuantity: DEFAULT_BENCHMARK_LOAD_MATRIX_SAMPLE_COUNT,
    },
  },
  userJourney: {
    title: 'User Journey Benchmarks',
    announceSamples: {
      sampleQuantity: DEFAULT_BENCHMARK_ITERATIONS,
    },
  },
  dappPageLoad: {
    title: 'Dapp Page Load Benchmarks',
    announceSamples: {
      sampleQuantity: DEFAULT_BENCHMARK_LOAD_MATRIX_SAMPLE_COUNT,
    },
  },
} as const satisfies Record<string, BenchmarkAnnounceSection>;
