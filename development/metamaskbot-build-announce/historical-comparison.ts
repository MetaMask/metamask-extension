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

export type HistoricalBaselineResult = {
  baseline: HistoricalBaselineReference;
  latestCommit: string;
  latestTimestamp: number;
};

/**
 * Fetches historical performance data from the `main` branch of
 * extension_benchmark_stats.
 *
 * @returns Reference map (benchmarkName -> metric -> baseline) with latest commit info, or null if unavailable.
 */
export async function fetchHistoricalPerformanceDataFromMain(): Promise<HistoricalBaselineResult | null> {
  try {
    const STATS_PERFORMANCE_DATA_URL =
      'https://raw.githubusercontent.com/MetaMask/extension_benchmark_stats/main/stats/main/performance_data.json';
    const response = await fetch(STATS_PERFORMANCE_DATA_URL);
    if (!response.ok) {
      return null;
    }
    const data = (await response.json()) as HistoricalPerformanceFile;
    if (Object.keys(data).length === 0) {
      return null;
    }
    const { baseline, latestCommit, latestTimestamp } =
      aggregateHistoricalDataWithCommit(data);
    return Object.keys(baseline).length > 0
      ? { baseline, latestCommit, latestTimestamp }
      : null;
  } catch {
    return null;
  }
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
      const arr = bucket[statKey];
      if (typeof raw === 'number' && !Number.isNaN(raw) && arr !== undefined) {
        arr.push(raw);
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
      ...(values.stdDev?.length ? { stdDev: mean(values.stdDev) } : {}),
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
 * Uses a window of 5 commits so that a single incomplete CI run
 * (e.g. missing the `pageLoad` preset) doesn't wipe out the entire
 * startup baseline, and to smooth out run-to-run variance.
 * Values from all commits are averaged together.
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
    .slice(0, 5);

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

/**
 * Aggregates historical data and returns the baseline along with the latest commit info.
 *
 * @param data - Full historical data file contents.
 * @returns Aggregated reference map with latest commit hash and timestamp.
 */
export function aggregateHistoricalDataWithCommit(
  data: HistoricalPerformanceFile,
): {
  baseline: HistoricalBaselineReference;
  latestCommit: string;
  latestTimestamp: number;
} {
  const sortedCommits = Object.keys(data)
    .filter((hash) => data[hash]?.timestamp)
    .sort((a, b) => data[b].timestamp - data[a].timestamp);

  const latestCommit = sortedCommits[0] || '';
  const latestTimestamp = data[latestCommit]?.timestamp || 0;
  const baseline = aggregateHistoricalData(data);

  return { baseline, latestCommit, latestTimestamp };
}
