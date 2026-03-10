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

  it('uses the most recent commit only', () => {
    // def456 is the last key → most recent when reversed
    const result = aggregateHistoricalData(mockFile);

    expect(result['pageLoad/standardHome']?.uiStartup?.mean).toBe(2000);
    expect(result['pageLoad/standardHome']?.uiStartup?.p75).toBe(2200);
    expect(result['pageLoad/standardHome']?.uiStartup?.p95).toBe(2600);
    expect(result['pageLoad/standardHome']?.load?.mean).toBe(600);
    expect(result['pageLoad/standardHome']?.load?.p75).toBe(660);
    expect(result['pageLoad/standardHome']?.load?.p95).toBe(780);
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

  it('parses string-encoded metric values', () => {
    const data = asHistoricalFile({
      c1: {
        timestamp: 1,
        presets: {
          pageLoad: {
            entry: {
              mean: { uiStartup: '1234.5' },
              p75: { uiStartup: '1350.0' },
              p95: { uiStartup: '1600.0' },
            },
          },
        },
      },
    });

    const result = aggregateHistoricalData(data);

    expect(result['pageLoad/entry']?.uiStartup?.mean).toBe(1234.5);
    expect(result['pageLoad/entry']?.uiStartup?.p75).toBe(1350);
    expect(result['pageLoad/entry']?.uiStartup?.p95).toBe(1600);
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

  it('returns aggregated data when target branch has history', async () => {
    mockFetch.mockReturnValue(makeOkResponse(mockFile));

    const result = await fetchHistoricalPerformanceData('main');

    expect(result).not.toBeNull();
    expect(result?.['pageLoad/standardHome']?.uiStartup?.mean).toBe(2000);
    // Should fetch the target branch file directly
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('main/performance_data.json'),
    );
  });

  it('sanitizes branch names with slashes', async () => {
    mockFetch.mockReturnValue(makeOkResponse(mockFile));

    await fetchHistoricalPerformanceData('release/12.5.0');

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('release-12.5.0/performance_data.json'),
    );
  });

  it('falls back to latest release branch when target has no data', async () => {
    const releaseDirs = [
      { name: 'release-12.5.0', type: 'dir' },
      { name: 'release-12.4.0', type: 'dir' },
    ];

    mockFetch
      .mockReturnValueOnce(makeNotFoundResponse()) // target branch: no data
      .mockReturnValueOnce(makeOkResponse(releaseDirs)) // GitHub API listing
      .mockReturnValueOnce(makeOkResponse(mockFile)); // release-12.5.0 data

    const result = await fetchHistoricalPerformanceData('main');

    expect(result).not.toBeNull();
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('release-12.5.0/performance_data.json'),
    );
  });

  it('sorts release branches by descending semver and tries the latest first', async () => {
    const releaseDirs = [
      { name: 'release-12.4.0', type: 'dir' },
      { name: 'release-12.10.0', type: 'dir' },
      { name: 'release-12.5.0', type: 'dir' },
    ];

    mockFetch
      .mockReturnValueOnce(makeNotFoundResponse()) // target branch
      .mockReturnValueOnce(makeOkResponse(releaseDirs)) // listing
      .mockReturnValueOnce(makeOkResponse(mockFile)); // first tried: release-12.10.0

    await fetchHistoricalPerformanceData('main');

    const calls = mockFetch.mock.calls.map((c: [string]) => c[0]);
    const releaseCall = calls.find(
      (url: string) =>
        url.includes('release-') && url.includes('performance_data.json'),
    );
    expect(releaseCall).toContain('release-12.10.0');
  });

  it('returns null when no branch has any data', async () => {
    mockFetch
      .mockReturnValueOnce(makeNotFoundResponse()) // target branch
      .mockReturnValueOnce(makeOkResponse([])); // empty listing

    const result = await fetchHistoricalPerformanceData('main');

    expect(result).toBeNull();
  });

  it('returns null when the GitHub API listing returns a non-OK response', async () => {
    mockFetch
      .mockReturnValueOnce(makeNotFoundResponse()) // target branch
      .mockReturnValueOnce(makeNotFoundResponse()); // listing API non-OK

    const result = await fetchHistoricalPerformanceData('main');

    expect(result).toBeNull();
  });

  it('treats two release branches with identical versions as equal (stable sort)', async () => {
    const releaseDirs = [
      { name: 'release-12.5.0', type: 'dir' },
      { name: 'release-12.5.0', type: 'dir' }, // duplicate — sort returns 0
    ];

    mockFetch
      .mockReturnValueOnce(makeNotFoundResponse()) // target branch
      .mockReturnValueOnce(makeOkResponse(releaseDirs)) // listing
      .mockReturnValueOnce(makeOkResponse(mockFile)); // first release

    const result = await fetchHistoricalPerformanceData('main');

    expect(result).not.toBeNull();
  });

  it('returns null when fetch throws', async () => {
    mockFetch.mockRejectedValue(new Error('network error'));

    const result = await fetchHistoricalPerformanceData('main');

    expect(result).toBeNull();
  });

  it('uses GITHUB_BASE_REF env var when called with no arguments', async () => {
    process.env.GITHUB_BASE_REF = 'release/12.5.0';
    mockFetch.mockReturnValue(makeOkResponse(mockFile));

    const result = await fetchHistoricalPerformanceData();

    expect(result).not.toBeNull();
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('release-12.5.0/performance_data.json'),
    );

    delete process.env.GITHUB_BASE_REF;
  });

  it('falls back to "main" when GITHUB_BASE_REF is not set and no arguments given', async () => {
    delete process.env.GITHUB_BASE_REF;
    mockFetch.mockReturnValue(makeOkResponse(mockFile));

    const result = await fetchHistoricalPerformanceData();

    expect(result).not.toBeNull();
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('main/performance_data.json'),
    );
  });

  it('skips a release branch that returns an empty object', async () => {
    const releaseDirs = [
      { name: 'release-12.5.0', type: 'dir' },
      { name: 'release-12.4.0', type: 'dir' },
    ];

    mockFetch
      .mockReturnValueOnce(makeNotFoundResponse()) // target branch
      .mockReturnValueOnce(makeOkResponse(releaseDirs)) // listing
      .mockReturnValueOnce(makeOkResponse({})) // release-12.5.0: empty object
      .mockReturnValueOnce(makeOkResponse(mockFile)); // release-12.4.0: has data

    const result = await fetchHistoricalPerformanceData('main');

    expect(result).not.toBeNull();
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('release-12.4.0/performance_data.json'),
    );
  });

  it('sorts release versions with unequal segment counts correctly', async () => {
    // Three entries so both av[i]??0 and bv[i]??0 branches are exercised:
    // release-12.5 (2 parts) compared against release-12.5.1 (3 parts) and vice-versa
    const releaseDirs = [
      { name: 'release-12.5', type: 'dir' }, // 2-part
      { name: 'release-12.5.1', type: 'dir' }, // 3-part, higher
      { name: 'release-12.4.0', type: 'dir' }, // 3-part, lower
    ];

    mockFetch
      .mockReturnValueOnce(makeNotFoundResponse())
      .mockReturnValueOnce(makeOkResponse(releaseDirs))
      .mockReturnValueOnce(makeOkResponse(mockFile));

    await fetchHistoricalPerformanceData('main');

    // release-12.5.1 should be tried first (highest version)
    const calls = mockFetch.mock.calls.map((c: [string]) => c[0]);
    const releaseCall = calls.find(
      (url: string) =>
        url.includes('release-') && url.includes('performance_data.json'),
    );
    expect(releaseCall).toContain('release-12.5.1');
  });

  it('skips non-directory entries in the GitHub API listing', async () => {
    const items = [
      { name: 'release-12.5.0', type: 'dir' },
      { name: 'README.md', type: 'file' },
      { name: 'main', type: 'dir' },
    ];

    mockFetch
      .mockReturnValueOnce(makeNotFoundResponse())
      .mockReturnValueOnce(makeOkResponse(items))
      .mockReturnValueOnce(makeOkResponse(mockFile));

    await fetchHistoricalPerformanceData('other-branch');

    // README.md and main (not release-*) should not be fetched
    const fetchedUrls = mockFetch.mock.calls.map((c: [string]) => c[0]);
    expect(fetchedUrls.some((u: string) => u.includes('README'))).toBe(false);
    // 'main' is a dir entry but doesn't start with 'release-', so it should not
    // be fetched as a stats branch (note: STATS_REPO_BASE itself contains '/main/'
    // so we check for the data file path specifically)
    expect(
      fetchedUrls.some(
        (u: string) =>
          u.includes('/main/performance_data.json') &&
          !u.includes('other-branch'),
      ),
    ).toBe(false);
  });

  it('skips the target branch in the fallback loop to avoid double-fetching', async () => {
    const releaseDirs = [{ name: 'release-12.5.0', type: 'dir' }];

    // release-12.5.0 is also the sanitized target branch
    mockFetch
      .mockReturnValueOnce(makeNotFoundResponse()) // release-12.5.0 (target)
      .mockReturnValueOnce(makeOkResponse(releaseDirs)); // listing // no 3rd call expected since it was already tried

    const result = await fetchHistoricalPerformanceData('release/12.5.0');

    expect(result).toBeNull();
    // Only 2 fetch calls — target + listing; release-12.5.0 not re-fetched
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it('falls back to release branch when target has entries but aggregation is empty', async () => {
    const invalidData = asHistoricalFile({
      commit1: {
        timestamp: 0,
        presets: {
          pageLoad: {
            entry: { mean: null },
          },
        },
      },
    });

    const releaseDirs = [{ name: 'release-12.5.0', type: 'dir' }];

    mockFetch
      .mockReturnValueOnce(makeOkResponse(invalidData))
      .mockReturnValueOnce(makeOkResponse(releaseDirs))
      .mockReturnValueOnce(makeOkResponse(mockFile));

    const result = await fetchHistoricalPerformanceData('main');

    expect(result).not.toBeNull();
    expect(result?.['pageLoad/standardHome']?.uiStartup?.mean).toBe(2000);
  });

  it('returns null when all branches produce empty aggregation', async () => {
    const invalidData = asHistoricalFile({
      commit1: {
        timestamp: 0,
        presets: {
          pageLoad: {
            entry: { mean: null },
          },
        },
      },
    });

    const releaseDirs = [{ name: 'release-12.5.0', type: 'dir' }];

    mockFetch
      .mockReturnValueOnce(makeOkResponse(invalidData))
      .mockReturnValueOnce(makeOkResponse(releaseDirs))
      .mockReturnValueOnce(makeOkResponse(invalidData));

    const result = await fetchHistoricalPerformanceData('main');

    expect(result).toBeNull();
  });

  it('includes Authorization header when GITHUB_TOKEN is set', async () => {
    process.env.GITHUB_TOKEN = 'test-token-123';
    mockFetch
      .mockReturnValueOnce(makeNotFoundResponse())
      .mockReturnValueOnce(makeOkResponse([]));

    await fetchHistoricalPerformanceData('main');

    const apiCall = mockFetch.mock.calls.find(
      (c: [string, RequestInit?]) =>
        typeof c[0] === 'string' && c[0].includes('api.github.com'),
    );
    expect(apiCall).toBeDefined();
    expect((apiCall as [string, RequestInit])[1]?.headers).toHaveProperty(
      'Authorization',
      'token test-token-123',
    );

    delete process.env.GITHUB_TOKEN;
  });
});
