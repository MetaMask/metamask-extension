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
    auxiliaryPages: 100,
    contentScripts: 60,
    timestamp: 2,
  } as const;

  const bundleSizeData = {
    [MERGE_BASE]: {
      background: 1500,
      ui: 2400,
      common: 400,
      auxiliaryPages: 90,
      contentScripts: 50,
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

  it('renders the webpack section with auxiliary pages and content scripts rows', async () => {
    mockSuccessfulFetches();

    const result = await buildBundleSizeDiffSection(artifacts, MERGE_BASE);

    expect(result).toContain('Webpack bundle size diffs');
    expect(result).toContain('auxiliary pages:');
    expect(result).toContain('content scripts:');
  });

  it('compares webpack against the stored baseline', async () => {
    mockSuccessfulFetches();

    const result = await buildBundleSizeDiffSection(artifacts, MERGE_BASE);

    expect(result).toContain(
      'background: total 1.56 KiB, diff +100 Bytes (6.67%)',
    );
    expect(result).toContain('ui: total 2.44 KiB, diff +100 Bytes (4.17%)');
    expect(result).toContain(
      'auxiliary pages: total 100 Bytes, diff +10 Bytes (11.11%)',
    );
    expect(result).toContain(
      'content scripts: total 60 Bytes, diff +10 Bytes (20%)',
    );
  });

  it('shows a warning when the background diff exceeds the threshold', async () => {
    mockSuccessfulFetches({
      webpack: {
        ...webpackSummary,
        background: 3000,
      },
    });

    const result = await buildBundleSizeDiffSection(artifacts, MERGE_BASE);

    expect(result).toContain('Warning! Bundle size has increased!');
  });

  it('does not use content scripts increases to trigger warnings', async () => {
    mockSuccessfulFetches({
      webpack: {
        ...webpackSummary,
        background: 1500,
        ui: 2400,
        common: 400,
        contentScripts: 50,
      },
    });

    const result = await buildBundleSizeDiffSection(artifacts, MERGE_BASE);

    expect(result).not.toContain('Warning!');
    expect(result).not.toContain('Bundle size reduced!');
  });

  it('renders comparison unavailable when the merge base baseline is missing', async () => {
    mockSuccessfulFetches({ storedData: {} });

    const result = await buildBundleSizeDiffSection(artifacts, MERGE_BASE);

    expect(result).toContain('Comparison unavailable.');
  });

  it('treats missing new baseline fields as zero during the cutover', async () => {
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
      'auxiliary pages: total 100 Bytes, diff +100 Bytes (100%)',
    );
    expect(result).toContain(
      'content scripts: total 60 Bytes, diff +60 Bytes (100%)',
    );
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

  it('falls back to comparison unavailable when the stored baseline fetch fails', async () => {
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

    expect(result).toContain('Comparison unavailable.');
    expect(result).toContain('background: total 1.56 KiB, diff n/a');
    expect(result).not.toContain('Bundle size data unavailable.');
  });
});
