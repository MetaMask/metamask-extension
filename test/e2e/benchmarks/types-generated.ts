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
