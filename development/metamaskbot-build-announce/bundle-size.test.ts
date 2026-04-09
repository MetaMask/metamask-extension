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

  const browserifyArtifact = {
    schemaVersion: 2,
    bundler: 'browserify',
    background: { size: 1100 },
    ui: { size: 2200 },
    common: { size: 300 },
    contentScripts: { size: 50 },
  };

  const webpackArtifact = {
    schemaVersion: 2,
    bundler: 'webpack',
    background: { size: 1600 },
    ui: { size: 2500 },
    common: { size: 400 },
    contentScripts: { size: 60 },
  };

  const bundleSizeData = {
    [MERGE_BASE]: {
      browserify: {
        schemaVersion: 2,
        bundler: 'browserify',
        background: 1000,
        ui: 2000,
        common: 300,
        contentScripts: 40,
        timestamp: 1,
      },
      webpack: {
        schemaVersion: 2,
        bundler: 'webpack',
        background: 1500,
        ui: 2400,
        common: 400,
        contentScripts: 50,
        timestamp: 1,
      },
    },
  };

  function mockSuccessfulFetches({
    browserify = browserifyArtifact,
    webpack = webpackArtifact,
    storedData = bundleSizeData,
  }: {
    browserify?: Record<string, unknown>;
    webpack?: Record<string, unknown>;
    storedData?: Record<string, unknown>;
  } = {}) {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(browserify),
      } as unknown as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(webpack),
      } as unknown as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(storedData),
      } as unknown as Response);
  }

  it('renders separate browserify and webpack sections with content scripts rows', async () => {
    mockSuccessfulFetches();

    const result = await buildBundleSizeDiffSection(artifacts, MERGE_BASE);

    expect(result).toContain('Browserify bundle size diffs');
    expect(result).toContain('Webpack bundle size diffs');
    expect(result).toContain('content scripts:');
  });

  it('compares each section only against the matching bundler baseline', async () => {
    mockSuccessfulFetches();

    const result = await buildBundleSizeDiffSection(artifacts, MERGE_BASE);

    expect(result).toContain('background: 100 Bytes (10%)');
    expect(result).toContain('ui: 100 Bytes (4.17%)');
    expect(result).toContain('content scripts: 10 Bytes (25%)');
  });

  it('shows a warning when the same-bundler background diff exceeds the threshold', async () => {
    mockSuccessfulFetches({
      browserify: {
        ...browserifyArtifact,
        background: { size: 3000 },
      },
    });

    const result = await buildBundleSizeDiffSection(artifacts, MERGE_BASE);

    expect(result).toContain('Warning! Bundle size has increased!');
  });

  it('does not use content scripts increases to trigger warnings', async () => {
    mockSuccessfulFetches({
      browserify: {
        ...browserifyArtifact,
        background: { size: 1000 },
        ui: { size: 2000 },
        common: { size: 300 },
        contentScripts: { size: 5000 },
      },
      webpack: {
        ...webpackArtifact,
        background: { size: 1500 },
        ui: { size: 2400 },
        common: { size: 400 },
        contentScripts: { size: 50 },
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

  it('renders comparison unavailable when the stored schema is incompatible', async () => {
    mockSuccessfulFetches({
      storedData: {
        [MERGE_BASE]: {
          browserify: {
            ...bundleSizeData[MERGE_BASE].browserify,
            schemaVersion: 1,
          },
          webpack: bundleSizeData[MERGE_BASE].webpack,
        },
      },
    });

    const result = await buildBundleSizeDiffSection(artifacts, MERGE_BASE);

    expect(result).toContain('Comparison unavailable.');
    expect(result).toContain('Webpack bundle size diffs');
  });

  it('renders comparison unavailable when the stored bundler does not match', async () => {
    mockSuccessfulFetches({
      storedData: {
        [MERGE_BASE]: {
          browserify: {
            ...bundleSizeData[MERGE_BASE].browserify,
            bundler: 'webpack',
          },
          webpack: bundleSizeData[MERGE_BASE].webpack,
        },
      },
    });

    const result = await buildBundleSizeDiffSection(artifacts, MERGE_BASE);

    expect(result).toContain('Comparison unavailable.');
  });

  it('throws when the browserify bundle size stats fetch fails', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      statusText: 'Not Found',
    } as Response);

    await expect(
      buildBundleSizeDiffSection(artifacts, MERGE_BASE),
    ).rejects.toThrow('Failed to fetch browserifyBundleSizeStats');
  });

  it('throws when the dev bundle size data fetch fails', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(browserifyArtifact),
      } as unknown as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(webpackArtifact),
      } as unknown as Response)
      .mockResolvedValueOnce({
        ok: false,
        statusText: 'Not Found',
      } as Response);

    await expect(
      buildBundleSizeDiffSection(artifacts, MERGE_BASE),
    ).rejects.toThrow('Failed to fetch devBundleSizeStats');
  });
});
