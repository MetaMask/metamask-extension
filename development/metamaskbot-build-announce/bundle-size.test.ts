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
    other: 100,
    contentScripts: 60,
    zip: 4200,
    timestamp: 2,
  };

  function mockSuccessfulFetches(
    storedData: Record<string, unknown> = {
      [MERGE_BASE]: { background: 1500, ui: 2400, common: 400 },
    },
  ) {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(webpackSummary),
      } as unknown as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(storedData),
      } as unknown as Response);
  }

  it('renders rows for other, content scripts, and zip', async () => {
    mockSuccessfulFetches();

    const result = await buildBundleSizeDiffSection(artifacts, MERGE_BASE);

    expect(result).toContain('<details>');
    expect(result).toContain('Bundle size diffs');
    expect(result).toContain('other: total 100 Bytes');
    expect(result).toContain('content scripts: total 60 Bytes');
    expect(result).toContain('zip: total 4.1 KiB');
  });

  it('shows n/a for missing baseline fields during the cutover', async () => {
    mockSuccessfulFetches({
      [MERGE_BASE]: { background: 1500, ui: 2400, common: 400 },
    });

    const result = await buildBundleSizeDiffSection(artifacts, MERGE_BASE);

    expect(result).toContain('other: total 100 Bytes, diff n/a');
    expect(result).toContain('content scripts: total 60 Bytes, diff n/a');
    expect(result).toContain('zip: total 4.1 KiB, diff n/a');
  });

  it('renders comparison unavailable when the merge base baseline is missing', async () => {
    mockSuccessfulFetches({});

    const result = await buildBundleSizeDiffSection(artifacts, MERGE_BASE);

    expect(result).toContain('Comparison unavailable.');
    expect(result).toContain('background: total 1.56 KiB, diff n/a');
    expect(result).toContain('zip: total 4.1 KiB, diff n/a');
  });

  it('renders bundle size unavailable when the current summary fetch fails', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: false,
        statusText: 'Not Found',
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({}),
      } as unknown as Response);

    const result = await buildBundleSizeDiffSection(artifacts, MERGE_BASE);

    expect(result).toContain('Bundle size data unavailable.');
  });

  it('shows a warning when the background diff exceeds the threshold', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            ...webpackSummary,
            background: 3000,
          }),
      } as unknown as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            [MERGE_BASE]: { background: 1500, ui: 2400, common: 400 },
          }),
      } as unknown as Response);

    const result = await buildBundleSizeDiffSection(artifacts, MERGE_BASE);

    expect(result).toContain('Warning! Bundle size has increased!');
  });
});
