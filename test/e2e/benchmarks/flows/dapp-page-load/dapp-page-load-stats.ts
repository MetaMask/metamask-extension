import {
  BENCHMARK_PERSONA,
  BENCHMARK_TYPE,
  type BenchmarkResults,
} from '../../../../../shared/constants/benchmarks';
import { calculateTimerStatistics } from '../../utils/statistics';
import { convertTimerStatisticsToBenchmarkResults } from '../../utils/runner';
import type {
  DappPageLoadMetric,
  DappPageLoadSample,
  DappPageLoadStats,
  TimerStatistics,
} from '../../utils/types';

const DAPP_PAGE_LOAD_BENCHMARK_KEY = 'dappPageLoad';

/**
 * Groups raw samples by page label, then builds {@link DappPageLoadStats} per page
 * (one {@link TimerStatistics} per numeric web-vital key).
 *
 * @param samples - Raw measurements from {@link PageLoadBenchmark}
 */
export function aggregateDappPageLoadStatistics(
  samples: DappPageLoadSample[],
): DappPageLoadStats[] {
  const resultsByPage = samples.reduce(
    (acc, result) => {
      if (!acc[result.page]) {
        acc[result.page] = [];
      }
      acc[result.page].push(result);
      return acc;
    },
    {} as Record<string, DappPageLoadSample[]>,
  );

  const summaries: DappPageLoadStats[] = [];

  for (const [page, pageResults] of Object.entries(resultsByPage)) {
    const metricRows = pageResults.map((r) => r.metrics);
    const metricKeys = Object.keys(metricRows[0]) as (keyof Omit<
      DappPageLoadMetric,
      'memoryUsage'
    >)[];

    const timers: TimerStatistics[] = [];
    for (const key of metricKeys) {
      const values = metricRows
        .map((m) => m[key])
        .filter((v): v is number => typeof v === 'number');
      if (values.length > 0) {
        timers.push(calculateTimerStatistics(key, values));
      }
    }

    summaries.push({ page, timers });
  }

  return summaries;
}

/**
 * Converts aggregated dapp page-load stats to the JSON shape used by CI and Sentry.
 * If multiple pages are present, later entries overwrite the same preset key (last wins).
 *
 * @param statsByPage - Per-page aggregates from {@link aggregateDappPageLoadStatistics}
 */
export function dappPageLoadStatsToBenchmarkResults(
  statsByPage: DappPageLoadStats[],
): Record<string, BenchmarkResults> {
  const results: Record<string, BenchmarkResults> = {};

  for (const pageStats of statsByPage) {
    results[DAPP_PAGE_LOAD_BENCHMARK_KEY] =
      convertTimerStatisticsToBenchmarkResults(
        pageStats.timers,
        DAPP_PAGE_LOAD_BENCHMARK_KEY,
        BENCHMARK_PERSONA.POWER_USER,
        BENCHMARK_TYPE.PERFORMANCE,
      );
  }

  return results;
}
