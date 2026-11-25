import { BENCHMARK_PERSONA } from '../../../../shared/constants/benchmarks';
import type {
  TimerStatistics,
  WebVitalsMetrics,
} from '../../../../shared/constants/benchmarks';
import type { Driver } from '../../webdriver/driver';
import { WARMUP_RUNS } from './constants';
import {
  applyStartupPageSignals,
  convertTimerStatisticsToBenchmarkResults,
  readStartupPageSignals,
  runBenchmarkWithIterations,
  runPageLoadBenchmark,
} from './runner';
import type { StartupMetrics } from './runner';
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

/**
 * One page load's metrics as `driver.collectMetrics` returns them.
 *
 * @param uiStartup - The value for every interval timed from navigation start.
 */
function pageLoadMetrics(uiStartup: number): Metrics {
  return {
    navigation: [
      {
        load: uiStartup,
        domContentLoaded: uiStartup,
        domInteractive: 20,
        type: 'navigate',
      },
    ],
    paint: {},
    'UI Startup': uiStartup,
    'Background Connect': 30,
    'First Render': 2,
    'Initial Actions': 2,
    'Load Scripts': uiStartup,
    'Setup Store': 18,
    numNetworkReqs: 40,
  };
}

describe('applyStartupPageSignals', () => {
  it('adds the hero time to the page load metrics', () => {
    const metrics = applyStartupPageSignals(pageLoadMetrics(1000), {
      heroPainted: 850,
    });

    expect(metrics.heroPainted).toBe(850);
    expect(metrics['UI Startup']).toBe(1000);
  });

  it('adds no hero time when the page set no mark', () => {
    const metrics = applyStartupPageSignals(pageLoadMetrics(1000), {
      heroPainted: null,
    });

    expect(metrics).not.toHaveProperty('heroPainted');
  });
});

describe('readStartupPageSignals', () => {
  const originalGetEntriesByName = performance.getEntriesByName;
  const driver = {
    executeScript: jest.fn((script: () => unknown) => script()),
    delay: jest.fn(async () => undefined),
  } as unknown as Driver;

  afterEach(() => {
    performance.getEntriesByName = originalGetEntriesByName;
  });

  it('reads the first hero mark in the page', async () => {
    performance.getEntriesByName = jest
      .fn()
      .mockReturnValue([{ startTime: 850 }, { startTime: 1900 }]);

    await expect(readStartupPageSignals(driver)).resolves.toStrictEqual({
      heroPainted: 850,
    });
    expect(performance.getEntriesByName).toHaveBeenCalledWith(
      'mm-hero-painted',
      'mark',
    );
  });

  it('reads null when the page set no hero mark before the timeout', async () => {
    performance.getEntriesByName = jest.fn().mockReturnValue([]);

    await expect(readStartupPageSignals(driver, 300)).resolves.toStrictEqual({
      heroPainted: null,
    });
    expect(performance.getEntriesByName).toHaveBeenCalledTimes(4);
  });

  it('waits for a hero mark set after the first read', async () => {
    performance.getEntriesByName = jest
      .fn()
      .mockReturnValueOnce([])
      .mockReturnValueOnce([])
      .mockReturnValue([{ startTime: 2600 }]);

    await expect(readStartupPageSignals(driver)).resolves.toStrictEqual({
      heroPainted: 2600,
    });
    expect(performance.getEntriesByName).toHaveBeenCalledTimes(3);
  });
});

describe('runPageLoadBenchmark heroPainted', () => {
  beforeEach(() => {
    jest.spyOn(console, 'log').mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  /**
   * A `measurePageFn` whose nth call is browser load n.
   *
   * @param heroByBrowserLoad - `heroPainted` per page load, per browser load.
   */
  function measurePageFn(heroByBrowserLoad: (number | null)[][]) {
    let call = 0;
    return async () => {
      const heroes = heroByBrowserLoad[call];
      call += 1;
      const metrics: StartupMetrics[] = heroes.map((heroPainted) =>
        applyStartupPageSignals(pageLoadMetrics(1000), { heroPainted }),
      );
      return {
        metrics,
        title: 'measurePageStandard',
        persona: BENCHMARK_PERSONA.STANDARD,
      };
    };
  }

  it('reports heroPainted in the statistics and keeps each page load in values', async () => {
    const results = await runPageLoadBenchmark(
      measurePageFn([
        [100, 100, 100],
        [800, 820, 840],
      ]),
      { browserLoads: 2, pageLoads: 3 },
    );

    expect(results.mean.heroPainted).toBe(820);
    expect(results.values?.heroPainted).toStrictEqual([
      { iteration: 3, value: 800 },
      { iteration: 4, value: 820 },
      { iteration: 5, value: 840 },
    ]);
  });

  it('leaves a page load with no mark out of the statistics', async () => {
    const results = await runPageLoadBenchmark(
      measurePageFn([
        [100, 100, 100],
        [800, null, 840],
      ]),
      { browserLoads: 2, pageLoads: 3 },
    );

    expect(results.mean.heroPainted).toBe(820);
    expect(results.min.heroPainted).toBe(800);
    expect(results.max.heroPainted).toBe(840);
  });

  it('counts the page loads with no mark in missingCount, and none when every load has one', async () => {
    const missing = await runPageLoadBenchmark(
      measurePageFn([
        [100, 100, 100],
        [null, null, 840],
      ]),
      { browserLoads: 2, pageLoads: 3 },
    );
    const complete = await runPageLoadBenchmark(
      measurePageFn([
        [100, 100, 100],
        [800, 820, 840],
      ]),
      { browserLoads: 2, pageLoads: 3 },
    );

    expect(missing.missingCount?.heroPainted).toBe(2);
    expect(missing.missingCount?.uiStartup).toBe(0);
    expect(complete.missingCount?.heroPainted).toBe(0);
  });

  it('counts a load with no mark as missing when it is the only one that lacks it', async () => {
    const results = await runPageLoadBenchmark(
      measurePageFn([
        [100, 100, 100],
        [null, 820, 840],
      ]),
      { browserLoads: 2, pageLoads: 3 },
    );

    // The mean covers the two loads that painted: the count is what shows a third did not.
    expect(results.mean.heroPainted).toBe(830);
    expect(results.missingCount?.heroPainted).toBe(1);
  });

  it('keeps a metric other than heroPainted that failed to read as NaN', async () => {
    const unreadable = {
      ...pageLoadMetrics(1000),
      'Load Scripts': Number.NaN,
    };
    const results = await runPageLoadBenchmark(
      async () => ({
        metrics: [pageLoadMetrics(1000), unreadable, pageLoadMetrics(1000)],
        title: 'measurePageStandard',
        persona: BENCHMARK_PERSONA.STANDARD,
      }),
      { browserLoads: 2, pageLoads: 3 },
    );

    expect(results.mean.loadScripts).toBeNaN();
    expect(results.missingCount?.loadScripts).toBe(1);
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

describe('runPageLoadBenchmark iteration numbering', () => {
  it('numbers retained values after the warm-up sessions', async () => {
    jest.spyOn(console, 'log').mockImplementation(() => undefined);
    const pageLoads = 2;
    const sessions = [
      [pageLoadMetrics(900), pageLoadMetrics(910)],
      [pageLoadMetrics(100), pageLoadMetrics(120)],
    ];
    const measurePageFn = jest.fn().mockImplementation(async () => ({
      metrics: sessions.shift(),
      title: 'measurePageStandard',
      persona: BENCHMARK_PERSONA.STANDARD,
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
