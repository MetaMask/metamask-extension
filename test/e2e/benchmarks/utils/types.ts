import type {
  Persona,
  BenchmarkType,
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

/** User action result with testTitle, persona and numeric timing metrics. */
export type UserActionResult = {
  testTitle: string;
  persona: Persona;
  benchmarkType?: BenchmarkType;
  [key: string]: string | number | undefined;
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
  success: boolean;
  error?: string;
  benchmarkType?: BenchmarkType;
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
};

export type PerformanceBenchmarkResults = {
  timestamp: string;
  benchmarks: BenchmarkSummary[];
};

export type BenchmarkFunction = () => Promise<BenchmarkRunResult>;
