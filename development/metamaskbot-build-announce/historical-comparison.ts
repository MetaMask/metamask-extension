/**
 * Historical data fetch and aggregation for performance benchmarks.
 *
 * Retrieves benchmark data from MetaMask/extension_benchmark_stats
 * and aggregates it into a mean-of-means reference for PR comment comparisons.
 */
import { calculateMean } from '../../test/e2e/benchmarks/utils/statistics';
import { STAT_KEY } from '../../shared/constants/benchmarks';
import type {
  BenchmarkResults,
  HistoricalBaselineMetrics,
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
      if (arr === undefined) {
        continue;
      }
      // Push a placeholder for a missing statistic rather than skipping it, so
      // index `i` is the same run in every series. Skipping shifted later
      // entries and let `mean[i]`, `p75[i]` and `stdDev[i]` refer to different
      // runs — which is what allowed the three published numbers to describe
      // different populations (MetaMask-planning#7204).
      arr.push(
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
 * Every published statistic is averaged over the **same** set of runs. The
 * previous implementation averaged each independently — `mean` over every run,
 * `stdDev` over only the runs that recorded one, `p75`/`p95` over only the runs
 * that recorded those — so the three numbers need not have described the same
 * population, or even the same runs. That is how a baseline could report
 * `stdDev ≈ 0` alongside `p75` far above `mean` without anything being
 * impossible (MetaMask-planning#7204).
 *
 * A run contributes only if it recorded `mean`, `p75` and `p95`. `stdDev`
 * remains optional because older entries predate it, but when present it is
 * averaged over exactly the contributing runs rather than over a wider set.
 *
 * Note what this `stdDev` is: the mean of each run's **within-run** scatter. It
 * does not describe run-to-run variation, and is not interchangeable with the
 * spread of the `mean` series. Consumers reasoning about between-run stability
 * need a different quantity.
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
    // Runs are collected in parallel arrays, so a shared index is the same run.
    // Only indices present in all three series describe a complete record.
    const complete: number[] = [];
    for (let i = 0; i < values.mean.length; i++) {
      if (
        Number.isFinite(values.mean[i]) &&
        Number.isFinite(values.p75[i]) &&
        Number.isFinite(values.p95[i])
      ) {
        complete.push(i);
      }
    }

    const pick = (series: number[]): number[] => complete.map((i) => series[i]);

    if (complete.length > 0) {
      const meanVal = calculateMean(pick(values.mean));
      if (Number.isNaN(meanVal)) {
        continue;
      }
      const stdDevs = complete
        .map((i) => values.stdDev?.[i])
        .filter((v): v is number => Number.isFinite(v));

      result[metric] = {
        mean: meanVal,
        // Emitted only when every contributing run recorded one. Averaging
        // over a subset is what let `stdDev` describe a different population
        // than `mean` and `p75`.
        ...(stdDevs.length === complete.length
          ? { stdDev: calculateMean(stdDevs) }
          : {}),
        p75: calculateMean(pick(values.p75)),
        p95: calculateMean(pick(values.p95)),
      };
      continue;
    }

    // No run recorded all three. This is the pre-existing documented fallback:
    // percentiles stand in as the mean. It is deliberately unchanged here —
    // it is a separate question from this fix, which is about runs that
    // recorded *some* statistics producing a baseline whose numbers came from
    // different run sets.
    const finiteMeans = values.mean.filter((v) => Number.isFinite(v));
    if (finiteMeans.length === 0) {
      continue;
    }
    const meanVal = calculateMean(finiteMeans);
    if (Number.isNaN(meanVal)) {
      continue;
    }
    const finiteP75 = values.p75.filter((v) => Number.isFinite(v));
    const finiteP95 = values.p95.filter((v) => Number.isFinite(v));
    if (finiteP75.length === 0) {
      console.warn(`No p75 data for ${name}/${metric}, using mean as fallback`);
    }
    if (finiteP95.length === 0) {
      console.warn(`No p95 data for ${name}/${metric}, using mean as fallback`);
    }
    result[metric] = {
      mean: meanVal,
      p75: finiteP75.length > 0 ? calculateMean(finiteP75) : meanVal,
      p95: finiteP95.length > 0 ? calculateMean(finiteP95) : meanVal,
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
