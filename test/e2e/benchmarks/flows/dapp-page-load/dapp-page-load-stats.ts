import {
  BENCHMARK_PERSONA,
  BENCHMARK_TYPE,
  type BenchmarkResults,
  type TimerStatistics,
} from '../../../../../shared/constants/benchmarks';
import { calculateTimerStatistics } from '../../utils/statistics';
import { convertTimerStatisticsToBenchmarkResults } from '../../utils/runner';
import type { DappPageLoadSample, DappPageLoadStats } from '../../utils/types';

const DAPP_PAGE_LOAD_BENCHMARK_KEY = 'dappPageLoad';

const NUMERIC_METRIC_KEYS = [
  'pageLoadTime',
  'domContentLoaded',
  'firstPaint',
  'firstContentfulPaint',
  'largestContentfulPaint',
] as const;

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

    const timers: TimerStatistics[] = [];
    for (const key of NUMERIC_METRIC_KEYS) {
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
 *
 * Currently only a single page is benchmarked. An assertion guards against
 * silent data loss if multiple pages are ever added without updating the
 * output key structure.
 *
 * @param statsByPage - Per-page aggregates from {@link aggregateDappPageLoadStatistics}
 */
export function dappPageLoadStatsToBenchmarkResults(
  statsByPage: DappPageLoadStats[],
): Record<string, BenchmarkResults> {
  if (statsByPage.length !== 1) {
    throw new Error(
      `Expected exactly 1 page in dapp page-load benchmark, got ${statsByPage.length}. ` +
        'If multiple pages are needed, update the output key to include the page label.',
    );
  }

  return {
    [DAPP_PAGE_LOAD_BENCHMARK_KEY]: convertTimerStatisticsToBenchmarkResults(
      statsByPage[0].timers,
      DAPP_PAGE_LOAD_BENCHMARK_KEY,
      BENCHMARK_PERSONA.POWER_USER,
      BENCHMARK_TYPE.PERFORMANCE,
    ),
  };
}
