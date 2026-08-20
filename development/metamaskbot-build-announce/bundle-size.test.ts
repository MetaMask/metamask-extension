import { getArtifactLinks } from './artifacts';
import {
  getHumanReadableSize,
  getPercentageChange,
  buildBundleSizeDiffSection,
} from './bundle-size';

describe('getHumanReadableSize', () => {
  it('returns "0 Bytes" for zero', () => {
    expect(getHumanReadableSize(0)).toBe('0 Bytes');
  });

  it('formats small values in Bytes', () => {
    expect(getHumanReadableSize(512)).toBe('512 Bytes');
  });

  it('formats values over 1024 in KiB', () => {
    expect(getHumanReadableSize(1536)).toBe('1.5 KiB');
  });

  it('formats values over 1 MiB in MiB', () => {
    expect(getHumanReadableSize(2 * 1024 * 1024)).toBe('2 MiB');
  });

  it('handles negative values', () => {
    expect(getHumanReadableSize(-2048)).toBe('-2 KiB');
  });
});

describe('getPercentageChange', () => {
  it('returns 0 when both values are zero', () => {
    expect(getPercentageChange(0, 0)).toBe(0);
  });

  it('returns 100 when from is zero and to is non-zero', () => {
    expect(getPercentageChange(0, 500)).toBe(100);
  });

  it('calculates positive percentage increase', () => {
    expect(getPercentageChange(100, 150)).toBe(50);
  });

  it('calculates negative percentage decrease', () => {
    expect(getPercentageChange(200, 100)).toBe(-50);
  });

  it('rounds to two decimal places', () => {
    expect(getPercentageChange(3, 4)).toBe(33.33);
  });
});

describe('buildBundleSizeDiffSection', () => {
  const HOST = 'https://ci.example.com';
  const MERGE_BASE = 'abc1234';
  const mockFetch = jest.fn();

  beforeEach(() => {
    global.fetch = mockFetch;
  });

  afterEach(() => {
    mockFetch.mockReset();
    jest.restoreAllMocks();
  });

  const artifacts = getArtifactLinks(
    HOST,
    'MetaMask',
    'metamask-extension',
    '1',
  );

  const webpackSummary = {
    background: 1600,
    ui: 2500,
    common: 400,
    other: 100,
    contentScripts: 60,
    unzipped: 6000,
    zip: 4200,
    timestamp: 2,
  } as const;

  const bundleSizeData = {
    [MERGE_BASE]: {
      background: 1500,
      ui: 2400,
      common: 400,
      other: 90,
      contentScripts: 50,
      unzipped: 5800,
      zip: 4000,
      timestamp: 1,
    },
  } as const;

  function mockSuccessfulFetches({
    webpack = webpackSummary,
    storedData = bundleSizeData,
  }: {
    webpack?: Record<string, unknown>;
    storedData?: Record<string, unknown>;
  } = {}) {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(webpack),
      } as unknown as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(storedData),
      } as unknown as Response);
  }

  it('renders the webpack section with a table row for each bundle part', async () => {
    mockSuccessfulFetches();

    const result = await buildBundleSizeDiffSection(artifacts, MERGE_BASE);

    expect(result).toContain('<details>');
    expect(result).toContain(
      '<summary><strong>Bundle Size Diffs</strong></summary>',
    );
    expect(result).toContain(
      '\n\n<br>\n\n| Status | Bundle | Total | Diff | Change |',
    );
    expect(result).toContain('| Status | Bundle | Total | Diff | Change |');
    expect(result).toContain('| ✅ | background |');
    expect(result).toContain('| ✅ | ui |');
    expect(result).toContain('| ✅ | common |');
    expect(result).toContain('| ✅ | other |');
    expect(result).toContain('| ✅ | content scripts |');
    expect(result).toContain('| ✅ | unzipped |');
    expect(result).toContain('| ✅ | zip |');
  });

  it('compares webpack against the stored baseline', async () => {
    mockSuccessfulFetches();

    const result = await buildBundleSizeDiffSection(artifacts, MERGE_BASE);

    expect(result).toContain(
      '| ✅ | background | 1.56 KiB | +100 Bytes | +6.67% |',
    );
    expect(result).toContain('| ✅ | ui | 2.44 KiB | +100 Bytes | +4.17% |');
    expect(result).toContain('| ✅ | common | 400 Bytes | 0 Bytes | 0.00% |');
    expect(result).toContain(
      '| ✅ | other | 100 Bytes | +10 Bytes | +11.11% |',
    );
    expect(result).toContain(
      '| ✅ | content scripts | 60 Bytes | +10 Bytes | +20.00% |',
    );
    expect(result).toContain(
      '| ✅ | unzipped | 5.86 KiB | +200 Bytes | +3.45% |',
    );
    expect(result).toContain('| ✅ | zip | 4.1 KiB | +200 Bytes | +5.00% |');
  });

  it('uses the first baseline candidate found in history data', async () => {
    mockSuccessfulFetches();

    const result = await buildBundleSizeDiffSection(
      artifacts,
      `unknown ${MERGE_BASE}`,
    );

    expect(result).toContain(
      '| ✅ | background | 1.56 KiB | +100 Bytes | +6.67% |',
    );
    expect(result).toContain('| ✅ | ui | 2.44 KiB | +100 Bytes | +4.17% |');
    expect(result).toContain('| ✅ | common | 400 Bytes | 0 Bytes | 0.00% |');
    expect(result).toContain(
      '| ✅ | other | 100 Bytes | +10 Bytes | +11.11% |',
    );
    expect(result).toContain(
      '| ✅ | content scripts | 60 Bytes | +10 Bytes | +20.00% |',
    );
    expect(result).toContain('| ✅ | zip | 4.1 KiB | +200 Bytes | +5.00% |');
  });

  it('shows a warning when the background diff exceeds the threshold', async () => {
    mockSuccessfulFetches({
      webpack: {
        ...webpackSummary,
        background: 3000,
      },
    });

    const result = await buildBundleSizeDiffSection(artifacts, MERGE_BASE);

    expect(result).toContain(
      '<summary><strong>Bundle Size Diffs [🚨 Warning! Bundle size has increased!]</strong></summary>',
    );
  });

  it('uses content scripts increases to trigger warnings', async () => {
    mockSuccessfulFetches({
      webpack: {
        ...webpackSummary,
        background: 1500,
        ui: 2400,
        common: 400,
        contentScripts: 1100,
      },
    });

    const result = await buildBundleSizeDiffSection(artifacts, MERGE_BASE);

    expect(result).toContain('Warning!');
  });

  it('uses content scripts reductions to trigger reduced warnings', async () => {
    mockSuccessfulFetches({
      webpack: {
        ...webpackSummary,
        background: 1500,
        ui: 2400,
        common: 400,
        contentScripts: 0,
      },
      storedData: {
        [MERGE_BASE]: {
          ...bundleSizeData[MERGE_BASE],
          contentScripts: 2000,
        },
      },
    });

    const result = await buildBundleSizeDiffSection(artifacts, MERGE_BASE);

    expect(result).toContain('Bundle size reduced!');
  });

  it('renders current sizes when baseline commit hashes are missing', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(webpackSummary),
    } as unknown as Response);

    const result = await buildBundleSizeDiffSection(artifacts);

    expect(result).toContain(
      '<summary><strong>Bundle Size Diffs</strong></summary>',
    );
    expect(result).toContain(
      '<small>No bundle-size baseline commit was available for this build, so diff values are omitted.</small>',
    );
    expect(result).toContain('|  | background | 1.56 KiB | n/a | n/a |');
    expect(result).toContain('|  | ui | 2.44 KiB | n/a | n/a |');
    expect(result).toContain('|  | common | 400 Bytes | n/a | n/a |');
    expect(result).toContain('|  | other | 100 Bytes | n/a | n/a |');
    expect(result).toContain('|  | content scripts | 60 Bytes | n/a | n/a |');
    expect(result).toContain('|  | zip | 4.1 KiB | n/a | n/a |');
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('renders current sizes when no baseline hash is found in history data', async () => {
    mockSuccessfulFetches({ storedData: {} });

    const result = await buildBundleSizeDiffSection(artifacts, MERGE_BASE);

    expect(result).toContain(
      '<summary><strong>Bundle Size Diffs</strong></summary>',
    );
    expect(result).toContain(
      '<small>No matching bundle-size baseline was found in the history data, so diff values are omitted.</small>',
    );
    expect(result).toContain('|  | background | 1.56 KiB | n/a | n/a |');
    expect(result).toContain('|  | ui | 2.44 KiB | n/a | n/a |');
    expect(result).toContain('|  | common | 400 Bytes | n/a | n/a |');
    expect(result).toContain('|  | other | 100 Bytes | n/a | n/a |');
    expect(result).toContain('|  | content scripts | 60 Bytes | n/a | n/a |');
    expect(result).toContain('|  | unzipped | 5.86 KiB | n/a | n/a |');
    expect(result).toContain('|  | zip | 4.1 KiB | n/a | n/a |');
  });

  it('renders available diffs and n/a for missing baseline fields during the cutover', async () => {
    mockSuccessfulFetches({
      storedData: {
        [MERGE_BASE]: {
          background: 1500,
          ui: 2400,
          common: 400,
          timestamp: 1,
        },
      },
    });

    const result = await buildBundleSizeDiffSection(artifacts, MERGE_BASE);

    expect(result).toContain(
      '| ✅ | background | 1.56 KiB | +100 Bytes | +6.67% |',
    );
    expect(result).toContain('| ✅ | ui | 2.44 KiB | +100 Bytes | +4.17% |');
    expect(result).toContain('| ✅ | common | 400 Bytes | 0 Bytes | 0.00% |');
    expect(result).toContain('|  | other | 100 Bytes | n/a | n/a |');
    expect(result).toContain('|  | content scripts | 60 Bytes | n/a | n/a |');
    expect(result).toContain('|  | unzipped | 5.86 KiB | n/a | n/a |');
    expect(result).toContain('|  | zip | 4.1 KiB | n/a | n/a |');
  });

  it('does not warn for missing content scripts baseline data', async () => {
    mockSuccessfulFetches({
      webpack: {
        ...webpackSummary,
        background: 1500,
        ui: 2400,
        common: 400,
        contentScripts: 5000,
      },
      storedData: {
        [MERGE_BASE]: {
          background: 1500,
          ui: 2400,
          common: 400,
          timestamp: 1,
        },
      },
    });

    const result = await buildBundleSizeDiffSection(artifacts, MERGE_BASE);

    expect(result).not.toContain('Warning!');
  });

  it('renders bundle size unavailable when the current summary fetch fails', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: false,
        statusText: 'Not Found',
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(bundleSizeData),
      } as unknown as Response);

    const result = await buildBundleSizeDiffSection(artifacts, MERGE_BASE);

    expect(result).toContain('Bundle size data unavailable.');
  });

  it('renders current sizes when the stored baseline fetch fails', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(webpackSummary),
      } as unknown as Response)
      .mockResolvedValueOnce({
        ok: false,
        statusText: 'Not Found',
      } as Response);

    const result = await buildBundleSizeDiffSection(artifacts, MERGE_BASE);

    expect(result).toContain(
      '<small>Bundle-size history data could not be loaded, so diff values are omitted.</small>',
    );
    expect(result).toContain('|  | background | 1.56 KiB | n/a | n/a |');
    expect(result).toContain('|  | ui | 2.44 KiB | n/a | n/a |');
    expect(result).toContain('|  | common | 400 Bytes | n/a | n/a |');
    expect(result).toContain('|  | other | 100 Bytes | n/a | n/a |');
    expect(result).toContain('|  | content scripts | 60 Bytes | n/a | n/a |');
    expect(result).toContain('|  | unzipped | 5.86 KiB | n/a | n/a |');
    expect(result).toContain('|  | zip | 4.1 KiB | n/a | n/a |');
    expect(result).not.toContain('Bundle size data unavailable.');
  });

  it('shows no warning when tracked bundle diffs are within threshold', async () => {
    mockSuccessfulFetches();

    const result = await buildBundleSizeDiffSection(artifacts, MERGE_BASE);

    expect(result).not.toContain('Warning!');
    expect(result).not.toContain('Bundle size reduced!');
  });
});
