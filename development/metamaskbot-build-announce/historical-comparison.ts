/**
 * Historical data fetch and aggregation for performance benchmarks.
 *
 * Retrieves benchmark data from MetaMask/extension_benchmark_stats
 * and aggregates it into a pooled reference for PR comment comparisons.
 */
import { calculateMean } from '../../test/e2e/benchmarks/utils/statistics';
import { STAT_KEY } from '../../shared/constants/benchmarks';
import type {
  BenchmarkResults,
  HistoricalBaselineMetrics,
  StatKey,
} from '../../shared/constants/benchmarks';
import { EXTENSION_BENCHMARK_STATS_MAIN_PERFORMANCE_DATA_URL } from './utils';

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
    const response = await fetch(
      EXTENSION_BENCHMARK_STATS_MAIN_PERFORMANCE_DATA_URL,
    );
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

type CollectedMetricValues = Record<StatKey, number[]>;

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
      // A missing statistic is stored as NaN rather than skipped, so index `i`
      // is the same run in every series (MetaMask-planning#7204).
      bucket[statKey].push(
        typeof raw === 'number' && !Number.isNaN(raw) ? raw : Number.NaN,
      );
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
 * Converts collected per-run values for one benchmark key into
 * HistoricalBaselineMetrics entries, skipping metrics with no valid data.
 *
 * All statistics describe the same runs, those with a finite `mean`
 * (MetaMask-planning#7204). `stdDev` pools them (mean within-run variance
 * plus variance of the run means) and is omitted unless every run recorded
 * one. `p75` and `p95` are reported only for a single run: per-run
 * percentiles cannot be combined, and the mean is no substitute.
 *
 * @param metrics - Collected arrays of values per metric.
 * @returns Map of metric name → baseline metrics.
 */
function buildMetricBaselines(
  metrics: Record<string, CollectedMetricValues>,
): Record<string, HistoricalBaselineMetrics> {
  const result: Record<string, HistoricalBaselineMetrics> = {};
  for (const [metric, values] of Object.entries(metrics)) {
    // Runs are collected in parallel arrays, so a shared index is the same run.
    const contributing: number[] = [];
    for (let i = 0; i < values.mean.length; i++) {
      if (Number.isFinite(values.mean[i])) {
        contributing.push(i);
      }
    }

    const pick = (series: number[]): number[] =>
      contributing.map((i) => series[i]);

    if (contributing.length === 0) {
      continue;
    }

    const means = pick(values.mean);
    const meanVal = calculateMean(means);

    const stdDevs = pick(values.stdDev).filter((v) => Number.isFinite(v));
    const baseline: HistoricalBaselineMetrics = { mean: meanVal };

    if (stdDevs.length === contributing.length) {
      // Runs are weighted equally: the history keeps no sample counts, so this
      // equals the stdDev of the pooled samples only for equal counts.
      const withinRunVariance = calculateMean(stdDevs.map((v) => v ** 2));
      const betweenRunVariance = calculateMean(
        means.map((runMean) => (runMean - meanVal) ** 2),
      );
      baseline.stdDev = Math.sqrt(withinRunVariance + betweenRunVariance);
    }

    if (contributing.length === 1) {
      const [p75] = pick(values.p75);
      const [p95] = pick(values.p95);
      if (Number.isFinite(p75)) {
        baseline.p75 = p75;
      }
      if (Number.isFinite(p95)) {
        baseline.p95 = p95;
      }
    }

    result[metric] = baseline;
  }
  return result;
}

/**
 * Aggregates historical benchmark data from the most recent commits
 * into a baseline reference keyed by benchmark name and metric,
 * with mean and stdDev, and p75 and p95 where a single run supplies them.
 *
 * Uses a window of 5 commits so that a single incomplete CI run
 * (e.g. missing the `pageLoad` preset) doesn't wipe out the entire
 * startup baseline, and to smooth out run-to-run variance.
 * Runs from all commits are combined per metric (see `buildMetricBaselines`).
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
    const baselines = buildMetricBaselines(metrics);
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
