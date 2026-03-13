import {
  aggregateHistoricalData,
  fetchHistoricalPerformanceData,
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

    // Both commits contribute to pageLoad/standardHome.uiStartup:
    // abc123: mean=1000, p75=1100, p95=1300
    // def456: mean=2000, p75=2200, p95=2600
    expect(result['pageLoad/standardHome']?.uiStartup?.mean).toBe(1500);
    expect(result['pageLoad/standardHome']?.uiStartup?.p75).toBe(1650);
    expect(result['pageLoad/standardHome']?.uiStartup?.p95).toBe(1950);
    // load: abc123 has (500,550,650), def456 has (600,660,780)
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

    // pageLoad only exists in the older commit but is still included
    expect(result['pageLoad/standardHome']?.uiStartup?.mean).toBe(1000);
    // userActions averaged across both commits: (300+400)/2 = 350
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

describe('fetchHistoricalPerformanceData', () => {
  const mockFetch = jest.fn();

  beforeEach(() => {
    global.fetch = mockFetch;
    jest.spyOn(console, 'log').mockImplementation();
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

  it('fetches main/performance_data.json and returns aggregated data', async () => {
    mockFetch.mockReturnValue(makeOkResponse(mockFile));

    const result = await fetchHistoricalPerformanceData();

    expect(result).not.toBeNull();
    // Averaged across both commits: (1000+2000)/2 = 1500
    expect(result?.['pageLoad/standardHome']?.uiStartup?.mean).toBe(1500);
    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('main/performance_data.json'),
    );
  });

  it('returns null when main has no data', async () => {
    mockFetch.mockReturnValue(makeNotFoundResponse());

    const result = await fetchHistoricalPerformanceData();

    expect(result).toBeNull();
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('returns null when main returns an empty object', async () => {
    mockFetch.mockReturnValue(makeOkResponse({}));

    const result = await fetchHistoricalPerformanceData();

    expect(result).toBeNull();
  });

  it('returns null when aggregation produces no valid metrics', async () => {
    const invalidData = asHistoricalFile({
      commit1: {
        timestamp: 0,
        presets: { pageLoad: { entry: { mean: null } } },
      },
    });
    mockFetch.mockReturnValue(makeOkResponse(invalidData));

    const result = await fetchHistoricalPerformanceData();

    expect(result).toBeNull();
  });

  it('returns null when fetch throws', async () => {
    mockFetch.mockRejectedValue(new Error('network error'));

    const result = await fetchHistoricalPerformanceData();

    expect(result).toBeNull();
  });
});
