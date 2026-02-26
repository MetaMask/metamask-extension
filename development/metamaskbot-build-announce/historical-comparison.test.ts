import {
  aggregateHistoricalData,
  fetchHistoricalUiStartupData,
  type HistoricalUiStartupFile,
} from './historical-comparison';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const makeCommit = (
  overrides: Partial<HistoricalUiStartupFile[string]> = {},
): HistoricalUiStartupFile[string] => ({
  timestamp: 1_700_000_000,
  presets: {
    pageLoad: {
      standardHome: {
        mean: { uiStartup: 1000, load: 500 },
      },
    },
    userActions: {
      loadNewAccount: {
        mean: { loadNewAccount: 300 },
      },
    },
  },
  ...overrides,
});

const mockFile: HistoricalUiStartupFile = {
  abc123: makeCommit(),
  def456: makeCommit({
    presets: {
      pageLoad: {
        standardHome: {
          mean: { uiStartup: 2000, load: 600 },
        },
      },
    },
  }),
};

// ---------------------------------------------------------------------------
// aggregateHistoricalData
// ---------------------------------------------------------------------------

describe('aggregateHistoricalData', () => {
  beforeEach(() => {
    jest.spyOn(console, 'log').mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('uses the most recent commit only', () => {
    // def456 is the last key → most recent when reversed
    const result = aggregateHistoricalData(mockFile);

    expect(result.standardHome?.uiStartup).toBe(2000);
    expect(result.standardHome?.load).toBe(600);
  });

  it('returns empty object when data has no commits', () => {
    const result = aggregateHistoricalData({});

    expect(result).toStrictEqual({});
  });

  it('uses the latest commit even when earlier commits have bad presets', () => {
    const data: HistoricalUiStartupFile = {
      bad1: { timestamp: 1, presets: {} },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      bad2: { timestamp: 2, presets: null as any },
      good: makeCommit(),
    };

    const result = aggregateHistoricalData(data);

    expect(result.standardHome?.uiStartup).toBe(1000);
  });

  it('skips benchmark entries where mean is null or missing', () => {
    const data: HistoricalUiStartupFile = {
      c1: {
        timestamp: 1,
        presets: {
          pageLoad: {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            badEntry: { mean: null as any },
            goodEntry: { mean: { uiStartup: 800 } },
          },
        },
      },
    };

    const result = aggregateHistoricalData(data);

    expect(result.badEntry).toBeUndefined();
    expect(result.goodEntry?.uiStartup).toBe(800);
  });

  it('skips NaN metric values', () => {
    const data: HistoricalUiStartupFile = {
      c1: {
        timestamp: 1,
        presets: {
          pageLoad: {
            entry: { mean: { good: 500, bad: NaN } },
          },
        },
      },
    };

    const result = aggregateHistoricalData(data);

    expect(result.entry?.good).toBe(500);
    expect(result.entry?.bad).toBeUndefined();
  });

  it('parses string-encoded metric values', () => {
    const data: HistoricalUiStartupFile = {
      c1: {
        timestamp: 1,
        presets: {
          pageLoad: {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            entry: { mean: { uiStartup: '1234.5' as any } },
          },
        },
      },
    };

    const result = aggregateHistoricalData(data);

    expect(result.entry?.uiStartup).toBe(1234.5);
  });
});

// ---------------------------------------------------------------------------
// fetchHistoricalUiStartupData
// ---------------------------------------------------------------------------

describe('fetchHistoricalUiStartupData', () => {
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

  const makeNotFoundResponse = () =>
    Promise.resolve({ ok: false } as Response);

  it('returns aggregated data when target branch has history', async () => {
    mockFetch.mockReturnValue(makeOkResponse(mockFile));

    const result = await fetchHistoricalUiStartupData('main');

    expect(result).not.toBeNull();
    expect(result?.standardHome?.uiStartup).toBe(2000);
    // Should fetch the target branch file directly
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('main/ui_startup_data.json'),
    );
  });

  it('sanitizes branch names with slashes', async () => {
    mockFetch.mockReturnValue(makeOkResponse(mockFile));

    await fetchHistoricalUiStartupData('release/12.5.0');

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('release-12.5.0/ui_startup_data.json'),
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

    const result = await fetchHistoricalUiStartupData('main');

    expect(result).not.toBeNull();
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('release-12.5.0/ui_startup_data.json'),
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

    await fetchHistoricalUiStartupData('main');

    const calls = mockFetch.mock.calls.map((c: [string]) => c[0]);
    const releaseCall = calls.find((url: string) =>
      url.includes('release-') && url.includes('ui_startup_data.json'),
    );
    expect(releaseCall).toContain('release-12.10.0');
  });

  it('returns null when no branch has any data', async () => {
    mockFetch
      .mockReturnValueOnce(makeNotFoundResponse()) // target branch
      .mockReturnValueOnce(makeOkResponse([])); // empty listing

    const result = await fetchHistoricalUiStartupData('main');

    expect(result).toBeNull();
  });

  it('returns null when the GitHub API listing returns a non-OK response', async () => {
    mockFetch
      .mockReturnValueOnce(makeNotFoundResponse()) // target branch
      .mockReturnValueOnce(makeNotFoundResponse()); // listing API non-OK

    const result = await fetchHistoricalUiStartupData('main');

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

    const result = await fetchHistoricalUiStartupData('main');

    expect(result).not.toBeNull();
  });

  it('returns null when fetch throws', async () => {
    mockFetch.mockRejectedValue(new Error('network error'));

    const result = await fetchHistoricalUiStartupData('main');

    expect(result).toBeNull();
  });

  it('uses GITHUB_BASE_REF env var when called with no arguments', async () => {
    process.env.GITHUB_BASE_REF = 'release/12.5.0';
    mockFetch.mockReturnValue(makeOkResponse(mockFile));

    const result = await fetchHistoricalUiStartupData();

    expect(result).not.toBeNull();
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('release-12.5.0/ui_startup_data.json'),
    );

    delete process.env.GITHUB_BASE_REF;
  });

  it('falls back to "main" when GITHUB_BASE_REF is not set and no arguments given', async () => {
    delete process.env.GITHUB_BASE_REF;
    mockFetch.mockReturnValue(makeOkResponse(mockFile));

    const result = await fetchHistoricalUiStartupData();

    expect(result).not.toBeNull();
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('main/ui_startup_data.json'),
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

    const result = await fetchHistoricalUiStartupData('main');

    expect(result).not.toBeNull();
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('release-12.4.0/ui_startup_data.json'),
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

    await fetchHistoricalUiStartupData('main');

    // release-12.5.1 should be tried first (highest version)
    const calls = mockFetch.mock.calls.map((c: [string]) => c[0]);
    const releaseCall = calls.find(
      (url: string) =>
        url.includes('release-') && url.includes('ui_startup_data.json'),
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

    await fetchHistoricalUiStartupData('other-branch');

    // README.md and main (not release-*) should not be fetched
    const fetchedUrls = mockFetch.mock.calls.map((c: [string]) => c[0]);
    expect(fetchedUrls.some((u: string) => u.includes('README'))).toBe(false);
    // 'main' is a dir entry but doesn't start with 'release-', so it should not
    // be fetched as a stats branch (note: STATS_REPO_BASE itself contains '/main/'
    // so we check for the data file path specifically)
    expect(
      fetchedUrls.some(
        (u: string) =>
          u.includes('/main/ui_startup_data.json') &&
          !u.includes('other-branch'),
      ),
    ).toBe(false);
  });

  it('skips the target branch in the fallback loop to avoid double-fetching', async () => {
    const releaseDirs = [
      { name: 'release-12.5.0', type: 'dir' },
    ];

    // release-12.5.0 is also the sanitized target branch
    mockFetch
      .mockReturnValueOnce(makeNotFoundResponse()) // release-12.5.0 (target)
      .mockReturnValueOnce(makeOkResponse(releaseDirs)) // listing
    ; // no 3rd call expected since it was already tried

    const result = await fetchHistoricalUiStartupData('release/12.5.0');

    expect(result).toBeNull();
    // Only 2 fetch calls — target + listing; release-12.5.0 not re-fetched
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });
});
