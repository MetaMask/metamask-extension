import {
  aggregateHistoricalData,
  aggregateHistoricalDataWithCommit,
  fetchHistoricalPerformanceDataFromMain,
  type HistoricalPerformanceFile,
} from './historical-comparison';

/**
 * Builds a HistoricalPerformanceFile from untyped data so tests can include
 * deliberately invalid values (null, string metrics) to exercise runtime guards.
 *
 * @param entries - Raw object entries to cast as HistoricalPerformanceFile.
 */
const asHistoricalFile = (
  entries: Record<string, unknown>,
): HistoricalPerformanceFile => entries as HistoricalPerformanceFile;

const makeCommit = (
  overrides: Partial<HistoricalPerformanceFile[string]> = {},
): HistoricalPerformanceFile[string] => ({
  timestamp: 1_700_000_000,
  presets: {
    pageLoad: {
      standardHome: {
        mean: { uiStartup: 1000, load: 500 },
        p75: { uiStartup: 1100, load: 550 },
        p95: { uiStartup: 1300, load: 650 },
      },
    },
    userActions: {
      loadNewAccount: {
        mean: { loadNewAccount: 300 },
        p75: { loadNewAccount: 330 },
        p95: { loadNewAccount: 380 },
      },
    },
  },
  ...overrides,
});

const mockFile: HistoricalPerformanceFile = {
  abc123: makeCommit(),
  def456: makeCommit({
    timestamp: 1_700_000_001,
    presets: {
      pageLoad: {
        standardHome: {
          mean: { uiStartup: 2000, load: 600 },
          p75: { uiStartup: 2200, load: 660 },
          p95: { uiStartup: 2600, load: 780 },
        },
      },
    },
  }),
};

describe('aggregateHistoricalData', () => {
  beforeEach(() => {
    jest.spyOn(console, 'log').mockImplementation();
    jest.spyOn(console, 'warn').mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('averages the means of the most recent commits and reports no percentile', () => {
    const result = aggregateHistoricalData(mockFile);

    expect(result['pageLoad/standardHome']?.uiStartup?.mean).toBe(1500);
    expect(result['pageLoad/standardHome']?.uiStartup?.p75).toBeUndefined();
    expect(result['pageLoad/standardHome']?.uiStartup?.p95).toBeUndefined();
    expect(result['pageLoad/standardHome']?.load?.mean).toBe(550);
    expect(result['pageLoad/standardHome']?.load?.p75).toBeUndefined();
    expect(result['pageLoad/standardHome']?.load?.p95).toBeUndefined();
  });

  it('includes data from older commits when latest is incomplete', () => {
    const data: HistoricalPerformanceFile = {
      old: makeCommit({ timestamp: 1_700_000_000 }),
      newest: {
        timestamp: 1_700_000_002,
        presets: {
          userActions: {
            loadNewAccount: {
              mean: { loadNewAccount: 400 },
              p75: { loadNewAccount: 440 },
              p95: { loadNewAccount: 500 },
            },
          },
        },
      },
    };

    const result = aggregateHistoricalData(data);

    expect(result['pageLoad/standardHome']?.uiStartup?.mean).toBe(1000);
    expect(result['userActions/loadNewAccount']?.loadNewAccount?.mean).toBe(
      350,
    );
  });

  it('returns empty object when data has no commits', () => {
    const result = aggregateHistoricalData({});

    expect(result).toStrictEqual({});
  });

  it('uses the latest commit even when earlier commits have bad presets', () => {
    const data = asHistoricalFile({
      bad1: { timestamp: 1, presets: {} },
      bad2: { timestamp: 2, presets: null },
      good: makeCommit(),
    });

    const result = aggregateHistoricalData(data);

    expect(result['pageLoad/standardHome']?.uiStartup?.mean).toBe(1000);
  });

  it('skips benchmark entries where mean is null or missing', () => {
    const data = asHistoricalFile({
      c1: {
        timestamp: 1,
        presets: {
          pageLoad: {
            badEntry: { mean: null },
            goodEntry: {
              mean: { uiStartup: 800 },
              p75: { uiStartup: 880 },
              p95: { uiStartup: 1040 },
            },
          },
        },
      },
    });

    const result = aggregateHistoricalData(data);

    expect(result['pageLoad/badEntry']).toBeUndefined();
    expect(result['pageLoad/goodEntry']?.uiStartup?.mean).toBe(800);
    expect(result['pageLoad/goodEntry']?.uiStartup?.p75).toBe(880);
    expect(result['pageLoad/goodEntry']?.uiStartup?.p95).toBe(1040);
  });

  it('skips NaN metric values', () => {
    const data = asHistoricalFile({
      c1: {
        timestamp: 1,
        presets: {
          pageLoad: {
            entry: {
              mean: { good: 500, bad: NaN },
              p75: { good: 550, bad: NaN },
              p95: { good: 650, bad: NaN },
            },
          },
        },
      },
    });

    const result = aggregateHistoricalData(data);

    expect(result['pageLoad/entry']?.good?.mean).toBe(500);
    expect(result['pageLoad/entry']?.good?.p75).toBe(550);
    expect(result['pageLoad/entry']?.good?.p95).toBe(650);
    expect(result['pageLoad/entry']?.bad).toBeUndefined();
  });

  it('skips commits where presets is missing', () => {
    const data = asHistoricalFile({
      c1: { timestamp: 1 },
    });

    const result = aggregateHistoricalData(data);

    expect(result).toStrictEqual({});
  });

  it('skips preset entries that are not objects', () => {
    const data = asHistoricalFile({
      c1: {
        timestamp: 1,
        presets: {
          pageLoad: 'not-an-object',
          userActions: makeCommit().presets.userActions,
        },
      },
    });

    const result = aggregateHistoricalData(data);

    expect(result['pageLoad/standardHome']).toBeUndefined();
    expect(result['userActions/loadNewAccount']?.loadNewAccount?.mean).toBe(
      300,
    );
  });

  it('keeps a run in the mean when it lacks a percentile', () => {
    // Percentiles are not combined across runs, so a missing p75 is no reason
    // to leave the run out of the mean.
    const data = asHistoricalFile({
      c1: {
        timestamp: 1,
        presets: {
          pageLoad: {
            entry: { mean: { metric: 100 }, p75: { metric: 100 } },
          },
        },
      },
      c2: {
        timestamp: 2,
        presets: {
          pageLoad: { entry: { mean: { metric: 100 } } },
        },
      },
      c3: {
        timestamp: 3,
        presets: {
          pageLoad: {
            entry: { mean: { metric: 1000 }, p75: { metric: 1000 } },
          },
        },
      },
    });

    const baseline = aggregateHistoricalData(data)['pageLoad/entry']?.metric;

    expect(baseline).toStrictEqual({ mean: 400 });
  });

  it('omits stdDev when only some contributing runs recorded it', () => {
    // A stdDev averaged over a subset describes a different population than
    // the mean beside it, which is how `stdDev ~ 0` could sit next to a p75
    // far above the mean. Emitting nothing is correct.
    const data = asHistoricalFile({
      c1: {
        timestamp: 1,
        presets: {
          pageLoad: {
            entry: {
              mean: { metric: 100 },
              stdDev: { metric: 5 },
              p75: { metric: 100 },
              p95: { metric: 100 },
            },
          },
        },
      },
      c2: {
        timestamp: 2,
        presets: {
          pageLoad: {
            entry: {
              mean: { metric: 1000 },
              p75: { metric: 1000 },
              p95: { metric: 1000 },
            },
          },
        },
      },
    });

    const result = aggregateHistoricalData(data);
    const baseline = result['pageLoad/entry']?.metric;

    expect(baseline?.mean).toBe(550);
    expect(baseline?.stdDev).toBeUndefined();
  });

  it('includes stdDev in the baseline when stdDev data is present', () => {
    const data = asHistoricalFile({
      c1: {
        timestamp: 1,
        presets: {
          pageLoad: {
            entry: {
              mean: { metric: 500 },
              stdDev: { metric: 30 },
              p75: { metric: 550 },
              p95: { metric: 650 },
            },
          },
        },
      },
      c2: {
        timestamp: 2,
        presets: {
          pageLoad: {
            entry: {
              mean: { metric: 600 },
              stdDev: { metric: 40 },
              p75: { metric: 660 },
              p95: { metric: 760 },
            },
          },
        },
      },
    });

    const result = aggregateHistoricalData(data);

    // Within-run variance 1250 plus between-run variance 2500.
    expect(result['pageLoad/entry']?.metric?.stdDev).toBeCloseTo(
      Math.sqrt(3750),
    );
  });

  it('skips entries where mean values average to NaN (e.g. Infinity + -Infinity)', () => {
    // Infinity and -Infinity are valid numbers and not NaN, so they pass the
    // typeof/isNaN guard in collectMetrics.  But mean([Infinity, -Infinity]) = NaN,
    // which must be caught by the NaN guard in buildMetricBaselines.
    const data = asHistoricalFile({
      c1: {
        timestamp: 1,
        presets: {
          pageLoad: {
            nanEntry: {
              mean: { metric: Infinity },
              p75: { metric: Infinity },
              p95: { metric: Infinity },
            },
          },
        },
      },
      c2: {
        timestamp: 2,
        presets: {
          pageLoad: {
            nanEntry: {
              mean: { metric: -Infinity },
              p75: { metric: -Infinity },
              p95: { metric: -Infinity },
            },
          },
        },
      },
    });

    const result = aggregateHistoricalData(data);

    // mean([Infinity, -Infinity]) = NaN → entry must be skipped
    expect(result['pageLoad/nanEntry']).toBeUndefined();
  });

  it('reports no percentile when p75 and p95 are missing', () => {
    const data = asHistoricalFile({
      c1: {
        timestamp: 1,
        presets: {
          pageLoad: {
            entry: {
              mean: { metric: 500 },
            },
          },
        },
      },
    });

    const result = aggregateHistoricalData(data);

    expect(result['pageLoad/entry']?.metric).toStrictEqual({ mean: 500 });
  });
});

describe('aggregateHistoricalData pooling', () => {
  beforeEach(() => {
    jest.spyOn(console, 'log').mockImplementation();
    jest.spyOn(console, 'warn').mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  type RunStats = {
    mean: number;
    stdDev?: number;
    p75?: number;
    p95?: number;
  };

  // One commit holding a single run of `pageLoad/entry/metric`.
  const commitWithRun = (timestamp: number, run: RunStats) => ({
    timestamp,
    presets: {
      pageLoad: {
        entry: {
          mean: { metric: run.mean },
          ...(run.stdDev === undefined
            ? {}
            : { stdDev: { metric: run.stdDev } }),
          ...(run.p75 === undefined ? {} : { p75: { metric: run.p75 } }),
          ...(run.p95 === undefined ? {} : { p95: { metric: run.p95 } }),
        },
      },
    },
  });

  const baselineOf = (runs: RunStats[]) =>
    aggregateHistoricalData(
      asHistoricalFile(
        Object.fromEntries(
          runs.map((run, index) => [
            `c${index}`,
            commitWithRun(index + 1, run),
          ]),
        ),
      ),
    )['pageLoad/entry']?.metric;

  it('adds the variance of the run means to stdDev', () => {
    // Two tight runs at different levels: the pooled samples span both, so the
    // stdDev is dominated by the 1000 ms gap, not the 10 ms within a run.
    const baseline = baselineOf([
      { mean: 1000, stdDev: 10 },
      { mean: 2000, stdDev: 10 },
    ]);

    expect(baseline?.mean).toBe(1500);
    expect(baseline?.stdDev).toBeCloseTo(Math.sqrt(100 + 500 ** 2), 6);
  });

  it('matches the stdDev of the raw pooled samples', () => {
    const runA = [90, 100, 110, 100];
    const runB = [190, 200, 210, 200];
    const summarize = (samples: number[]) => {
      const mean = samples.reduce((a, b) => a + b, 0) / samples.length;
      const variance =
        samples.reduce((a, b) => a + (b - mean) ** 2, 0) / samples.length;
      return { mean, stdDev: Math.sqrt(variance) };
    };

    const baseline = baselineOf([summarize(runA), summarize(runB)]);
    const pooled = summarize([...runA, ...runB]);

    expect(baseline?.mean).toBeCloseTo(pooled.mean, 9);
    expect(baseline?.stdDev).toBeCloseTo(pooled.stdDev, 9);
  });

  it('keeps stdDev at the within-run value when runs agree on the mean', () => {
    const baseline = baselineOf([
      { mean: 1000, stdDev: 30 },
      { mean: 1000, stdDev: 30 },
    ]);

    expect(baseline?.stdDev).toBeCloseTo(30, 9);
  });

  it('reproduces a single run unchanged, percentiles included', () => {
    const baseline = baselineOf([
      { mean: 1000, stdDev: 25, p75: 1020, p95: 1050 },
    ]);

    expect(baseline).toStrictEqual({
      mean: 1000,
      stdDev: 25,
      p75: 1020,
      p95: 1050,
    });
  });

  it('omits a percentile the single run did not report', () => {
    const baseline = baselineOf([{ mean: 1000, stdDev: 10, p95: 1300 }]);

    expect(baseline).toStrictEqual({ mean: 1000, stdDev: 10, p95: 1300 });
  });

  it('reports no percentile across several runs', () => {
    // A mean of per-run p75s is not the p75 of the pooled samples, so none is
    // reported, and the mean does not stand in for it.
    const baseline = baselineOf([
      { mean: 1000, stdDev: 10, p75: 1010, p95: 1020 },
      { mean: 2000, stdDev: 10, p75: 2010, p95: 2020 },
    ]);

    expect(baseline?.p75).toBeUndefined();
    expect(baseline?.p95).toBeUndefined();
  });

  it('omits stdDev when one run has none, leaving the mean over every run', () => {
    const baseline = baselineOf([
      { mean: 1000, stdDev: 10 },
      { mean: 1000, stdDev: 10 },
      { mean: 4000 },
    ]);

    expect(baseline).toStrictEqual({ mean: 2000 });
  });
});

describe('aggregateHistoricalDataWithCommit', () => {
  it('returns baseline data with latest commit hash and timestamp', () => {
    const data: HistoricalPerformanceFile = {
      abc123: makeCommit({ timestamp: 1_700_000_000 }),
      def456: makeCommit({ timestamp: 1_700_000_001 }),
      ghi789: makeCommit({ timestamp: 1_700_000_002 }),
    };

    const result = aggregateHistoricalDataWithCommit(data);

    expect(result.latestCommit).toBe('ghi789');
    expect(result.latestTimestamp).toBe(1_700_000_002);
    expect(result.baseline).toBeDefined();
    expect(result.baseline['pageLoad/standardHome']).toBeDefined();
  });

  it('returns empty string and 0 timestamp when data is empty', () => {
    const data: HistoricalPerformanceFile = {};

    const result = aggregateHistoricalDataWithCommit(data);

    expect(result.latestCommit).toBe('');
    expect(result.latestTimestamp).toBe(0);
    expect(result.baseline).toStrictEqual({});
  });

  it('returns the most recent commit when commits are out of order', () => {
    const data: HistoricalPerformanceFile = {
      old: makeCommit({ timestamp: 1_700_000_000 }),
      newest: makeCommit({ timestamp: 1_700_000_003 }),
      middle: makeCommit({ timestamp: 1_700_000_001 }),
    };

    const result = aggregateHistoricalDataWithCommit(data);

    expect(result.latestCommit).toBe('newest');
    expect(result.latestTimestamp).toBe(1_700_000_003);
  });

  it('filters out commits without timestamps', () => {
    const data = asHistoricalFile({
      valid: makeCommit({ timestamp: 1_700_000_001 }),
      noTimestamp: { presets: {} },
      nullTimestamp: { timestamp: null, presets: {} },
    });

    const result = aggregateHistoricalDataWithCommit(data);

    expect(result.latestCommit).toBe('valid');
    expect(result.latestTimestamp).toBe(1_700_000_001);
  });

  it('aggregates baseline from the same commits used to find latest', () => {
    const data: HistoricalPerformanceFile = {
      commit1: makeCommit({
        timestamp: 1_700_000_000,
        presets: {
          pageLoad: {
            standardHome: {
              mean: { uiStartup: 1000 },
              p75: { uiStartup: 1100 },
              p95: { uiStartup: 1200 },
            },
          },
        },
      }),
      commit2: makeCommit({
        timestamp: 1_700_000_001,
        presets: {
          pageLoad: {
            standardHome: {
              mean: { uiStartup: 2000 },
              p75: { uiStartup: 2200 },
              p95: { uiStartup: 2400 },
            },
          },
        },
      }),
      commit3: makeCommit({
        timestamp: 1_700_000_002,
        presets: {
          pageLoad: {
            standardHome: {
              mean: { uiStartup: 3000 },
              p75: { uiStartup: 3300 },
              p95: { uiStartup: 3600 },
            },
          },
        },
      }),
    };

    const result = aggregateHistoricalDataWithCommit(data);

    expect(result.latestCommit).toBe('commit3');
    expect(result.latestTimestamp).toBe(1_700_000_002);
    // Should average across all 3 commits
    expect(result.baseline['pageLoad/standardHome']?.uiStartup?.mean).toBe(
      2000,
    );
  });
});

describe('fetchHistoricalPerformanceDataFromMain', () => {
  const mockFetch = jest.fn();

  beforeEach(() => {
    global.fetch = mockFetch;
    jest.spyOn(console, 'warn').mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
    mockFetch.mockReset();
  });

  const makeOkResponse = (body: unknown) =>
    Promise.resolve({
      ok: true,
      json: () => Promise.resolve(body),
    } as Response);

  const makeNotFoundResponse = () => Promise.resolve({ ok: false } as Response);

  it('fetches from main and returns aggregated data with commit info', async () => {
    mockFetch.mockReturnValueOnce(makeOkResponse(mockFile));

    const result = await fetchHistoricalPerformanceDataFromMain();

    expect(result?.baseline['pageLoad/standardHome']?.uiStartup?.mean).toBe(
      1500,
    );
    expect(result?.latestCommit).toBe('def456');
    expect(result?.latestTimestamp).toBe(1_700_000_001);
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('stats/main/performance_data.json'),
    );
  });

  it('returns null when main has no data', async () => {
    mockFetch.mockReturnValueOnce(makeNotFoundResponse());

    const result = await fetchHistoricalPerformanceDataFromMain();

    expect(result).toBeNull();
  });

  it('returns null when main returns an empty object', async () => {
    mockFetch.mockReturnValueOnce(makeOkResponse({}));

    const result = await fetchHistoricalPerformanceDataFromMain();

    expect(result).toBeNull();
  });

  it('omits p75 when p75 data is absent from all commits', async () => {
    // Only mean and p95 provided — no p75 in the benchmark results
    const data = asHistoricalFile({
      commit1: {
        timestamp: 1_700_000_000,
        presets: {
          pageLoad: {
            standardHome: {
              mean: { uiStartup: 1000 },
              p95: { uiStartup: 1300 },
            },
          },
        },
      },
    });

    const result = aggregateHistoricalData(data);

    expect(result['pageLoad/standardHome']?.uiStartup?.p75).toBeUndefined();
    expect(result['pageLoad/standardHome']?.uiStartup?.p95).toBe(1300);
  });

  it('omits p95 when p95 data is absent from all commits', async () => {
    // Only mean and p75 provided — no p95 in the benchmark results
    const data = asHistoricalFile({
      commit1: {
        timestamp: 1_700_000_000,
        presets: {
          pageLoad: {
            standardHome: {
              mean: { uiStartup: 1000 },
              p75: { uiStartup: 1100 },
              // p95 intentionally absent
            },
          },
        },
      },
    });

    const result = aggregateHistoricalData(data);

    expect(result['pageLoad/standardHome']?.uiStartup?.p95).toBeUndefined();
    expect(result['pageLoad/standardHome']?.uiStartup?.p75).toBe(1100);
  });

  it('returns null when aggregation produces no valid metrics', async () => {
    const invalidData = asHistoricalFile({
      commit1: {
        timestamp: 0,
        presets: { pageLoad: { entry: { mean: null } } },
      },
    });
    mockFetch.mockReturnValueOnce(makeOkResponse(invalidData));

    const result = await fetchHistoricalPerformanceDataFromMain();

    expect(result).toBeNull();
  });

  it('returns null when fetch throws', async () => {
    mockFetch.mockRejectedValue(new Error('network error'));

    const result = await fetchHistoricalPerformanceDataFromMain();

    expect(result).toBeNull();
  });
});
