import type {
  TimerStatistics,
  WebVitalsMetrics,
} from '../../../../shared/constants/benchmarks';
import { WARMUP_RUNS } from './constants';
import {
  convertTimerStatisticsToBenchmarkResults,
  runBenchmarkWithIterations,
  runPageLoadBenchmark,
} from './runner';
import type { BenchmarkRunResult, MeasurePageResult, Metrics } from './types';

function createTimerStats(
  id: string,
  overrides: Partial<TimerStatistics> = {},
): TimerStatistics {
  return {
    id,
    mean: 100,
    min: 90,
    max: 110,
    stdDev: 5,
    cv: 5,
    p50: 100,
    p75: 105,
    p95: 109,
    p99: 110,
    samples: 3,
    outliers: 0,
    dataQuality: 'good',
    ...overrides,
  };
}

describe('convertTimerStatisticsToBenchmarkResults', () => {
  it("carries each timer's retained values into the artifact", () => {
    const results = convertTimerStatisticsToBenchmarkResults(
      [
        createTimerStats('uiStartup', {
          values: [
            { iteration: 0, value: 90 },
            { iteration: 2, value: 110 },
          ],
        }),
      ],
      'measurePageStandard',
    );

    expect(results.values).toStrictEqual({
      uiStartup: [
        { iteration: 0, value: 90 },
        { iteration: 2, value: 110 },
      ],
    });
  });

  it('omits values entirely when no timer retained any', () => {
    const results = convertTimerStatisticsToBenchmarkResults(
      [createTimerStats('uiStartup')],
      'measurePageStandard',
    );

    expect(results).not.toHaveProperty('values');
    expect(results.mean.uiStartup).toBe(100);
  });

  it('keeps the metrics that did retain values when another did not', () => {
    const results = convertTimerStatisticsToBenchmarkResults(
      [
        createTimerStats('uiStartup', {
          values: [{ iteration: 0, value: 90 }],
        }),
        createTimerStats('load'),
      ],
      'measurePageStandard',
    );

    expect(Object.keys(results.values ?? {})).toStrictEqual(['uiStartup']);
  });
});

describe('runBenchmarkWithIterations', () => {
  it('numbers retained values by iteration, leaving a gap after a failed first iteration', async () => {
    // `retry` logs the failed iteration.
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
    const outcomes: BenchmarkRunResult[] = [
      { timers: [], success: false, error: 'first iteration failed' },
      { timers: [{ id: 'uiStartup', value: 100 }], success: true },
      { timers: [{ id: 'uiStartup', value: 120 }], success: true },
    ];
    const benchmarkFn = jest
      .fn<Promise<BenchmarkRunResult>, []>()
      .mockImplementation(async () => outcomes.shift() as BenchmarkRunResult);

    const summary = await runBenchmarkWithIterations(
      'runner-test',
      benchmarkFn,
      3,
      0,
      {},
    );

    const expected = [
      { iteration: 1, value: 100 },
      { iteration: 2, value: 120 },
    ];
    expect(summary.failedRuns).toBe(1);
    expect(
      summary.timers.find((timer) => timer.id === 'uiStartup')?.values,
    ).toStrictEqual(expected);
    expect(
      summary.timers.find((timer) => timer.id === 'total')?.values,
    ).toStrictEqual(expected);
  });
});

function createMetrics(uiStartup: number): Metrics {
  return {
    navigation: [
      {
        load: 500,
        domContentLoaded: 400,
        domInteractive: 300,
        type: 'navigate',
      },
    ],
    paint: { 'first-paint': 200 },
    'UI Startup': uiStartup,
    'Background Connect': 10,
    'First Render': 20,
    'Initial Actions': 30,
    'Load Scripts': 40,
    'Setup Store': 50,
    numNetworkReqs: 5,
  };
}

describe('runPageLoadBenchmark', () => {
  it('numbers retained values after the warm-up sessions', async () => {
    const pageLoads = 2;
    const sessions = [
      [createMetrics(900), createMetrics(910)],
      [createMetrics(100), createMetrics(120)],
    ];
    const measurePageFn = jest.fn().mockImplementation(async () => ({
      metrics: sessions.shift(),
      title: 'home',
      persona: 'standard',
    }));

    const results = await runPageLoadBenchmark(measurePageFn, {
      browserLoads: WARMUP_RUNS + 1,
      pageLoads,
    });

    // With a plain counter these would be 0 and 1.
    const warmupSize = WARMUP_RUNS * pageLoads;
    expect(WARMUP_RUNS).toBeGreaterThan(0);
    expect(results.values?.uiStartup).toStrictEqual([
      { iteration: warmupSize, value: 100 },
      { iteration: warmupSize + 1, value: 120 },
    ]);
  });
});

describe('runBenchmarkWithIterations', () => {
  const warmUpVitals = { inp: null, fcp: 9999, lcp: null, cls: null };
  const scoredVitals = { inp: null, fcp: 100, lcp: null, cls: null };

  const runFlow = async (iterations: number, warmupRuns?: number) => {
    let call = 0;
    const benchmarkFn = async (): Promise<BenchmarkRunResult> => {
      call += 1;
      const isFirst = call === 1;
      return {
        success: true,
        timers: [
          { id: 'step', value: isFirst ? 9000 : 1000 + call },
          // Only the first run reports this one.
          ...(isFirst ? [{ id: 'firstRunOnly', value: 5000 }] : []),
          {
            id: 'longTaskCount',
            value: isFirst ? 40 : 2,
            unit: 'count' as const,
          },
        ],
        webVitals: (isFirst ? warmUpVitals : scoredVitals) as WebVitalsMetrics,
      };
    };
    return runBenchmarkWithIterations(
      'flow',
      benchmarkFn,
      iterations,
      0,
      {},
      warmupRuns,
    );
  };

  it('scores every run when no warm-up is named', async () => {
    const summary = await runFlow(3);

    expect(summary.iterations).toBe(3);
    expect(summary.successfulRuns).toBe(3);
    expect(summary.timers.map(({ id }) => id)).toContain('firstRunOnly');
  });

  it('drops the warm-up runs from the timers, the long-task results and the web vitals', async () => {
    const summary = await runFlow(4, 1);

    const ids = summary.timers.map(({ id }) => id);
    expect(ids).not.toContain('firstRunOnly');
    expect(ids).toStrictEqual(
      expect.arrayContaining(['step', 'longTaskCount', 'total']),
    );
    expect(summary.timers.find(({ id }) => id === 'step')?.samples).toBe(3);
    expect(summary.timers.find(({ id }) => id === 'longTaskCount')?.mean).toBe(
      2,
    );
    expect(summary.webVitals?.runs.map(({ iteration }) => iteration)).toEqual([
      1, 2, 3,
    ]);
    expect(summary.webVitals?.runs.every(({ fcp }) => fcp === 100)).toBe(true);
  });

  it('counts only the scored runs', async () => {
    const summary = await runFlow(4, 1);

    expect(summary.iterations).toBe(3);
    expect(summary.successfulRuns).toBe(3);
    expect(summary.failedRuns).toBe(0);
  });

  it("numbers each retained value by its run's original iteration", async () => {
    const summary = await runFlow(4, 1);
    const step = summary.timers.find((timer) => timer.id === 'step');

    expect(step?.values?.map((sample) => sample.iteration)).toStrictEqual([
      1, 2, 3,
    ]);
  });

  it('refuses a run with no run left to score', async () => {
    await expect(runFlow(1, 1)).rejects.toThrow(
      'iterations (1) must be greater than the warm-up runs (1)',
    );
  });
});
