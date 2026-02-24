import { promises as fs } from 'fs';
import type { BenchmarkSummary } from '../../test/e2e/page-objects/benchmark/page-load-benchmark';
import { getDappBenchmarkComment } from './dapp-benchmarks';

jest.mock('fs', () => ({
  promises: {
    readFile: jest.fn(),
  },
}));

const mockFetch = jest.fn();
global.fetch = mockFetch;

const MOCK_COMMIT = 'abc1234567890';

function buildMockSummary(
  overrides: Partial<BenchmarkSummary> = {},
): BenchmarkSummary {
  return {
    page: 'chrome-extension://abc/home.html',
    samples: 5,
    mean: {
      pageLoadTime: 900,
      domContentLoaded: 1100,
      firstContentfulPaint: 700,
    },
    standardDeviation: {
      pageLoadTime: 50,
      domContentLoaded: 60,
      firstContentfulPaint: 30,
    },
    min: {
      pageLoadTime: 800,
      domContentLoaded: 1000,
      firstContentfulPaint: 650,
    },
    max: {
      pageLoadTime: 1100,
      domContentLoaded: 1300,
      firstContentfulPaint: 800,
    },
    p95: {
      pageLoadTime: 1050,
      domContentLoaded: 1250,
      firstContentfulPaint: 780,
    },
    p99: {
      pageLoadTime: 1090,
      domContentLoaded: 1290,
      firstContentfulPaint: 795,
    },
    ...overrides,
  };
}

function buildMockBenchmarkOutput(summaries?: BenchmarkSummary[]) {
  return {
    timestamp: Date.now(),
    commit: MOCK_COMMIT,
    summary: summaries ?? [buildMockSummary()],
    rawResults: [],
  };
}

describe('getDappBenchmarkComment', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'warn').mockImplementation();
    jest.spyOn(console, 'log').mockImplementation();
    process.env = { ...originalEnv, HEAD_COMMIT_HASH: MOCK_COMMIT };
    mockFetch.mockResolvedValue({ ok: false, statusText: 'Not Found' });
  });

  afterEach(() => {
    jest.restoreAllMocks();
    process.env = originalEnv;
  });

  it('returns null when benchmark file does not exist', async () => {
    (fs.readFile as jest.Mock).mockRejectedValue(new Error('ENOENT'));

    const result = await getDappBenchmarkComment();

    expect(result).toBeNull();
  });

  it('returns a comment with benchmark data when file exists', async () => {
    const mockData = buildMockBenchmarkOutput();
    (fs.readFile as jest.Mock).mockResolvedValue(JSON.stringify(mockData));

    const result = await getDappBenchmarkComment();

    expect(result).not.toBeNull();
    expect(result).toContain('Dapp Page Load Benchmarks');
    expect(result).toContain(MOCK_COMMIT.slice(0, 7));
    expect(result).toContain('pageLoadTime');
  });

  it('includes performance emoji indicators', async () => {
    const mockData = buildMockBenchmarkOutput([
      buildMockSummary({
        mean: {
          pageLoadTime: 500,
          domContentLoaded: 600,
          firstContentfulPaint: 400,
        },
      }),
    ]);
    (fs.readFile as jest.Mock).mockResolvedValue(JSON.stringify(mockData));

    const result = await getDappBenchmarkComment();

    expect(result).toContain('🟢');
  });

  it('shows warning emoji for slow metrics', async () => {
    const mockData = buildMockBenchmarkOutput([
      buildMockSummary({
        mean: {
          pageLoadTime: 1500,
          domContentLoaded: 2000,
          firstContentfulPaint: 1200,
        },
      }),
    ]);
    (fs.readFile as jest.Mock).mockResolvedValue(JSON.stringify(mockData));

    const result = await getDappBenchmarkComment();

    expect(result).toContain('🟡');
  });

  it('shows red emoji for poor metrics', async () => {
    const mockData = buildMockBenchmarkOutput([
      buildMockSummary({
        mean: {
          pageLoadTime: 3000,
          domContentLoaded: 3000,
          firstContentfulPaint: 2000,
        },
      }),
    ]);
    (fs.readFile as jest.Mock).mockResolvedValue(JSON.stringify(mockData));

    const result = await getDappBenchmarkComment();

    expect(result).toContain('🔴');
  });

  it('returns no-results message when summary is empty', async () => {
    const mockData = buildMockBenchmarkOutput([]);
    (fs.readFile as jest.Mock).mockResolvedValue(JSON.stringify(mockData));

    const result = await getDappBenchmarkComment();

    expect(result).toContain('No benchmark results available');
  });

  it('includes comparison with historical data when available', async () => {
    const mockData = buildMockBenchmarkOutput();
    (fs.readFile as jest.Mock).mockResolvedValue(JSON.stringify(mockData));

    const historicalData = {
      commit1: buildMockBenchmarkOutput([
        buildMockSummary({
          mean: {
            pageLoadTime: 950,
            domContentLoaded: 1150,
            firstContentfulPaint: 750,
          },
        }),
      ]),
    };

    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => historicalData,
    });

    const result = await getDappBenchmarkComment();

    expect(result).toContain('historical');
  });

  it('handles fetch failure for historical data gracefully', async () => {
    const mockData = buildMockBenchmarkOutput();
    (fs.readFile as jest.Mock).mockResolvedValue(JSON.stringify(mockData));
    mockFetch.mockRejectedValue(new Error('Network error'));

    const result = await getDappBenchmarkComment();

    expect(result).not.toBeNull();
    expect(result).toContain('Dapp Page Load Benchmarks');
  });

  it('formats time values correctly (ms and seconds)', async () => {
    const mockData = buildMockBenchmarkOutput([
      buildMockSummary({
        mean: { pageLoadTime: 500, domContentLoaded: 1500 },
        standardDeviation: { pageLoadTime: 50, domContentLoaded: 100 },
      }),
    ]);
    (fs.readFile as jest.Mock).mockResolvedValue(JSON.stringify(mockData));

    const result = await getDappBenchmarkComment();

    expect(result).toContain('500ms');
    expect(result).toContain('1.50s');
  });

  it('includes detailed results table', async () => {
    const mockData = buildMockBenchmarkOutput();
    (fs.readFile as jest.Mock).mockResolvedValue(JSON.stringify(mockData));

    const result = await getDappBenchmarkComment();

    expect(result).toContain('Detailed Results');
    expect(result).toContain('Mean');
    expect(result).toContain('Std Dev');
    expect(result).toContain('Min');
    expect(result).toContain('Max');
    expect(result).toContain('P95');
    expect(result).toContain('P99');
  });

  it('renders multiple pages separately', async () => {
    const mockData = buildMockBenchmarkOutput([
      buildMockSummary({ page: 'chrome-extension://abc/home.html' }),
      buildMockSummary({ page: 'chrome-extension://abc/popup.html' }),
    ]);
    (fs.readFile as jest.Mock).mockResolvedValue(JSON.stringify(mockData));

    const result = await getDappBenchmarkComment();

    expect(result).toContain('home.html');
    expect(result).toContain('popup.html');
  });

  it('warns about significant performance regressions', async () => {
    const currentSummary = buildMockSummary({
      mean: {
        pageLoadTime: 2000,
        domContentLoaded: 1100,
        firstContentfulPaint: 700,
      },
    });
    const mockData = buildMockBenchmarkOutput([currentSummary]);
    (fs.readFile as jest.Mock).mockResolvedValue(JSON.stringify(mockData));

    const historicalData = {
      commit1: buildMockBenchmarkOutput([
        buildMockSummary({
          mean: {
            pageLoadTime: 800,
            domContentLoaded: 1100,
            firstContentfulPaint: 700,
          },
        }),
      ]),
    };
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => historicalData,
    });

    const result = await getDappBenchmarkComment();

    expect(result).toContain('Performance Warning');
    expect(result).toContain('regression');
  });
});
