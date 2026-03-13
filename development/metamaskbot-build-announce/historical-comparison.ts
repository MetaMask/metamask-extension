/**
 * Historical data fetch and aggregation for performance benchmarks.
 *
 * Retrieves benchmark data from MetaMask/extension_benchmark_stats
 * and aggregates it into a mean-of-means reference for PR comment comparisons.
 */
import mean from 'lodash/mean';
import { STAT_KEY } from '../../shared/constants/benchmarks';
import type {
  BenchmarkResults,
  HistoricalBaselineMetrics,
} from '../../shared/constants/benchmarks';

const STATS_REPO_BASE =
  'https://raw.githubusercontent.com/MetaMask/extension_benchmark_stats/main/stats';

/**
 * All presets in performance_data.json share the same nested shape:
 * preset name → benchmark name → benchmark result.
 *
 * - startupStandardHome:        { "uiStartup": { "mean": {...} }, ... }
 * - startupPowerUserHome:       { "uiStartup": { "mean": {...} }, ... }
 * - interactionUserActions:     { "loadNewAccount": { "mean": {...} }, "confirmTx": { "mean": {...} } }
 * - userJourneyAssets:          { "assetClickToPriceChart": { "mean": {...} }, ... }
 * - pageLoad (legacy group):    { "chrome-browserify-standardHome": { "mean": {...} }, ... }
 */
type NestedPresetEntry = Record<string, Partial<BenchmarkResults>>;

type HistoricalCommitEntry = {
  timestamp: number;
  presets: Record<string, NestedPresetEntry>;
};

export type HistoricalPerformanceFile = Record<string, HistoricalCommitEntry>;

export type HistoricalBaselineReference = Record<
  string,
  Record<string, HistoricalBaselineMetrics>
>;

/**
 * Fetches and parses performance_data.json for a given branch slug.
 * Returns null if the file does not exist or cannot be parsed.
 *
 * @param branch - Branch name as stored in the stats repo (e.g. "main").
 * @returns Parsed file contents or null.
 */
async function fetchPerformanceFile(
  branch: string,
): Promise<HistoricalPerformanceFile | null> {
  try {
    const response = await fetch(
      `${STATS_REPO_BASE}/${branch}/performance_data.json`,
    );
    if (!response.ok) {
      return null;
    }
    return (await response.json()) as HistoricalPerformanceFile;
  } catch {
    return null;
  }
}

// TODO: When release branch 13.23.0 is out, we can switch to target release branch,
// replace the hardcoded 'main' in fetchHistoricalPerformanceData with:
//   sanitizeBranch(process.env.GITHUB_BASE_REF ?? 'main')
// and uncomment sanitizeBranch below.
//
// function sanitizeBranch(branch: string): string {
//   return branch.replace(/\//gu, '-');
// }

/**
 * Fetches historical performance data from extension_benchmark_stats,
 * using `main` as the baseline branch.
 *
 * @returns Reference map (benchmarkName → metric → mean), or null if unavailable.
 */
export async function fetchHistoricalPerformanceData(): Promise<HistoricalBaselineReference | null> {
  const data = await fetchPerformanceFile('main');
  if (!data || Object.keys(data).length === 0) {
    return null;
  }
  const result = aggregateHistoricalData(data);
  return Object.keys(result).length > 0 ? result : null;
}

type CollectedMetricValues = {
  [K in keyof HistoricalBaselineMetrics]: number[];
};

type CollectedData = Record<string, Record<string, CollectedMetricValues>>;

/**
 * Collects metric values from a single benchmark result into the accumulator.
 *
 * @param key - Accumulator key (`presetName/benchmarkName`).
 * @param result - The benchmark entry to read from.
 * @param collected - Mutable accumulator map.
 */
function collectMetrics(
  key: string,
  result: Partial<BenchmarkResults>,
  collected: CollectedData,
): void {
  if (!result.mean || typeof result.mean !== 'object') {
    return;
  }
  if (!collected[key]) {
    collected[key] = {};
  }
  for (const metricName of Object.keys(result.mean)) {
    if (!collected[key][metricName]) {
      collected[key][metricName] = { mean: [], stdDev: [], p75: [], p95: [] };
    }
    const bucket = collected[key][metricName];
    for (const statKey of Object.values(STAT_KEY)) {
      const raw = (result[statKey] as Record<string, unknown> | undefined)?.[
        metricName
      ];
      if (typeof raw === 'number' && !Number.isNaN(raw)) {
        bucket[statKey].push(raw);
      }
    }
  }
}

/**
 * Accumulates metric values for all presets in a single commit.
 *
 * @param commitData - The commit entry to process.
 * @param collected - Mutable accumulator map.
 */
function collectCommitPresets(
  commitData: HistoricalCommitEntry,
  collected: CollectedData,
): void {
  if (!commitData.presets) {
    return;
  }
  for (const [presetName, presetEntry] of Object.entries(commitData.presets)) {
    if (!presetEntry || typeof presetEntry !== 'object') {
      continue;
    }
    for (const [benchmarkName, result] of Object.entries(presetEntry)) {
      collectMetrics(`${presetName}/${benchmarkName}`, result, collected);
    }
  }
}

/**
 * Converts averaged CollectedMetricValues for one benchmark key into
 * HistoricalBaselineMetrics entries, skipping metrics with no valid data.
 *
 * @param name - Benchmark key (used only for warning messages).
 * @param metrics - Collected arrays of values per metric.
 * @returns Map of metric name → baseline metrics.
 */
function buildMetricBaselines(
  name: string,
  metrics: Record<string, CollectedMetricValues>,
): Record<string, HistoricalBaselineMetrics> {
  const result: Record<string, HistoricalBaselineMetrics> = {};
  for (const [metric, values] of Object.entries(metrics)) {
    if (values.mean.length === 0) {
      continue;
    }
    const meanVal = mean(values.mean);
    if (Number.isNaN(meanVal)) {
      continue;
    }
    if (values.p75.length === 0) {
      console.warn(`No p75 data for ${name}/${metric}, using mean as fallback`);
    }
    if (values.p95.length === 0) {
      console.warn(`No p95 data for ${name}/${metric}, using mean as fallback`);
    }
    result[metric] = {
      mean: meanVal,
      stdDev: values.stdDev.length > 0 ? mean(values.stdDev) : 0,
      p75: values.p75.length > 0 ? mean(values.p75) : meanVal,
      p95: values.p95.length > 0 ? mean(values.p95) : meanVal,
    };
  }
  return result;
}

/**
 * Aggregates historical benchmark data from the most recent commits
 * into a baseline reference keyed by benchmark name and metric,
 * with mean, p75, and p95 values.
 *
 * Uses a window of 3 commits so that a single incomplete CI run
 * (e.g. missing the `pageLoad` preset) doesn't wipe out the entire
 * startup baseline. Values from all commits are averaged together.
 *
 * @param data - Full historical data file contents.
 * @returns Aggregated reference map.
 */
export function aggregateHistoricalData(
  data: HistoricalPerformanceFile,
): HistoricalBaselineReference {
  const latestCommits = Object.keys(data)
    .filter((hash) => data[hash]?.timestamp)
    .sort((a, b) => data[b].timestamp - data[a].timestamp)
    .slice(0, 3);

  const collected: CollectedData = {};
  for (const hash of latestCommits) {
    if (data[hash]) {
      collectCommitPresets(data[hash], collected);
    }
  }

  const reference: HistoricalBaselineReference = {};
  for (const [name, metrics] of Object.entries(collected)) {
    const baselines = buildMetricBaselines(name, metrics);
    if (Object.keys(baselines).length > 0) {
      reference[name] = baselines;
    }
  }
  return reference;
}
