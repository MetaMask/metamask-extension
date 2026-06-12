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

  const prStats = {
    background: { size: 1100 },
    ui: { size: 2200 },
    common: { size: 300 },
  };
  const devStats = {
    [MERGE_BASE]: { background: 1000, ui: 2000, common: 300 },
  };

  function mockSuccessfulFetches() {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(prStats),
      } as unknown as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(devStats),
      } as unknown as Response);
  }

  it('returns a collapsible details section with size diff rows', async () => {
    mockSuccessfulFetches();

    const result = await buildBundleSizeDiffSection(artifacts, MERGE_BASE);

    expect(result).toContain('<details>');
    expect(result).toContain('Bundle size diffs');
    expect(result).toContain('background:');
    expect(result).toContain('ui:');
    expect(result).toContain('common:');
  });

  it('uses the first baseline candidate found in history data', async () => {
    mockSuccessfulFetches();

    const result = await buildBundleSizeDiffSection(
      artifacts,
      `unknown ${MERGE_BASE}`,
    );

    expect(result).toContain('background: 100 Bytes (10%)');
    expect(result).toContain('ui: 200 Bytes (10%)');
    expect(result).toContain('common: 0 Bytes (0%)');
  });

  it('shows a warning when the background bundle increases beyond the threshold', async () => {
    const bigIncrease = {
      background: { size: 3000 },
      ui: { size: 2000 },
      common: { size: 300 },
    };
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(bigIncrease),
      } as unknown as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(devStats),
      } as unknown as Response);

    const result = await buildBundleSizeDiffSection(artifacts, MERGE_BASE);

    expect(result).toContain('Warning! Bundle size has increased!');
  });

  it('shows a reduction notice when the bundle shrinks beyond the threshold', async () => {
    const bigDecrease = {
      background: { size: 100 },
      ui: { size: 100 },
      common: { size: 100 },
    };
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(bigDecrease),
      } as unknown as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(devStats),
      } as unknown as Response);

    const result = await buildBundleSizeDiffSection(artifacts, MERGE_BASE);

    expect(result).toContain('Bundle size reduced!');
  });

  it('shows no warning when diffs are within threshold', async () => {
    mockSuccessfulFetches();

    const result = await buildBundleSizeDiffSection(artifacts, MERGE_BASE);

    expect(result).not.toContain('Warning!');
    expect(result).not.toContain('Bundle size reduced!');
  });

  it('throws when the PR bundle size stats fetch fails', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      statusText: 'Not Found',
    } as Response);

    await expect(
      buildBundleSizeDiffSection(artifacts, MERGE_BASE),
    ).rejects.toThrow('Failed to fetch prBundleSizeStats');
  });

  it('renders current sizes when baseline commit hashes are missing', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(prStats),
    } as unknown as Response);

    const result = await buildBundleSizeDiffSection(artifacts);

    expect(result).toContain('Bundle sizes');
    expect(result).toContain('background: 1.07 KiB');
    expect(result).toContain('ui: 2.15 KiB');
    expect(result).toContain('common: 300 Bytes');
    expect(result).toContain(
      '<small>No bundle-size baseline commit was available for this build, so diff values are omitted.</small>',
    );
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('renders current sizes when the dev bundle size data fetch fails', async () => {
    jest.spyOn(console, 'warn').mockImplementation();
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(prStats),
      } as unknown as Response)
      .mockResolvedValueOnce({
        ok: false,
        statusText: 'Not Found',
      } as Response);

    const result = await buildBundleSizeDiffSection(artifacts, MERGE_BASE);

    expect(result).toContain('Bundle sizes');
    expect(result).toContain('background: 1.07 KiB');
    expect(result).toContain('ui: 2.15 KiB');
    expect(result).toContain('common: 300 Bytes');
    expect(result).toContain(
      '<small>Bundle-size history data could not be loaded, so diff values are omitted.</small>',
    );
  });

  it('renders current sizes when the baseline commit hash is not in history data', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(prStats),
      } as unknown as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({}),
      } as unknown as Response);

    const result = await buildBundleSizeDiffSection(artifacts, 'unknown-hash');

    expect(result).toContain('Bundle sizes');
    expect(result).toContain('background: 1.07 KiB');
    expect(result).toContain('ui: 2.15 KiB');
    expect(result).toContain('common: 300 Bytes');
    expect(result).toContain(
      '<small>No matching bundle-size baseline was found in the history data, so diff values are omitted.</small>',
    );
  });
});
