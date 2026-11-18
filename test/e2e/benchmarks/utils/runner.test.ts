import { BENCHMARK_PERSONA } from '../../../../shared/constants/benchmarks';
import type { TimerStatistics } from '../../../../shared/constants/benchmarks';
import type { Driver } from '../../webdriver/driver';
import {
  applyStartupPageSignals,
  convertTimerStatisticsToBenchmarkResults,
  readStartupPageSignals,
  runPageLoadBenchmark,
} from './runner';
import type { StartupMetrics } from './runner';
import type { Metrics } from './types';

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

  it('reads null when the page set no hero mark', async () => {
    performance.getEntriesByName = jest.fn().mockReturnValue([]);

    await expect(readStartupPageSignals(driver)).resolves.toStrictEqual({
      heroPainted: null,
    });
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
});
