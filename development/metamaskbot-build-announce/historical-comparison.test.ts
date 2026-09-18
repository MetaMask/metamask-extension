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

  it('averages across the 3 most recent commits', () => {
    const result = aggregateHistoricalData(mockFile);

    expect(result['pageLoad/standardHome']?.uiStartup?.mean).toBe(1500);
    expect(result['pageLoad/standardHome']?.uiStartup?.p75).toBe(1650);
    expect(result['pageLoad/standardHome']?.uiStartup?.p95).toBe(1950);
    expect(result['pageLoad/standardHome']?.load?.mean).toBe(550);
    expect(result['pageLoad/standardHome']?.load?.p75).toBe(605);
    expect(result['pageLoad/standardHome']?.load?.p95).toBe(715);
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

    // stdDev true-branch: result should include a stdDev field
    expect(result['pageLoad/entry']?.metric).toHaveProperty('stdDev');
    expect(result['pageLoad/entry']?.metric?.stdDev).toBeCloseTo(35);
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

  it('falls back to mean when p75/p95 data is missing', () => {
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

    expect(result['pageLoad/entry']?.metric?.mean).toBe(500);
    expect(result['pageLoad/entry']?.metric?.p75).toBe(500);
    expect(result['pageLoad/entry']?.metric?.p95).toBe(500);
    expect(console.warn).toHaveBeenCalledWith(
      expect.stringContaining('No p75 data'),
    );
    expect(console.warn).toHaveBeenCalledWith(
      expect.stringContaining('No p95 data'),
    );
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

  it('uses mean as fallback p75 when p75 data is absent from all commits', async () => {
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

    expect(result['pageLoad/standardHome']?.uiStartup?.p75).toBe(1000);
    expect(result['pageLoad/standardHome']?.uiStartup?.p95).toBe(1300);
  });

  it('uses mean as fallback p95 when p95 data is absent from all commits', async () => {
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

    // p95 should fall back to the mean value (1000)
    expect(result['pageLoad/standardHome']?.uiStartup?.p95).toBe(1000);
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
