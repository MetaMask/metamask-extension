import type {
  BenchmarkMetrics,
  BenchmarkSummary,
} from '../../test/e2e/page-objects/benchmark/page-load-benchmark';
import {
  formatTime,
  formatStandardDeviation,
  getEmojiForMetric,
  getComparisonEmoji,
  hasSignificantIncrease,
  aggregateHistoricalBenchmarkData,
  generateBenchmarkComment,
  getMetricValues,
} from './dapp-benchmarks';

const MOCK_COMMIT = 'abc1234567890';

function buildMockMetrics(
  overrides: Partial<BenchmarkMetrics> = {},
): BenchmarkMetrics {
  return {
    pageLoadTime: 900,
    domContentLoaded: 1100,
    firstContentfulPaint: 700,
    firstPaint: 600,
    largestContentfulPaint: 1200,
    ...overrides,
  } as BenchmarkMetrics;
}

function buildMockSummary(
  overrides: Partial<BenchmarkSummary> = {},
): BenchmarkSummary {
  return {
    page: 'chrome-extension://abc/home.html',
    samples: 5,
    mean: buildMockMetrics(),
    standardDeviation: buildMockMetrics({
      pageLoadTime: 50,
      domContentLoaded: 60,
      firstContentfulPaint: 30,
    }),
    min: buildMockMetrics({
      pageLoadTime: 800,
      domContentLoaded: 1000,
      firstContentfulPaint: 650,
    }),
    max: buildMockMetrics({
      pageLoadTime: 1100,
      domContentLoaded: 1300,
      firstContentfulPaint: 800,
    }),
    p95: buildMockMetrics({
      pageLoadTime: 1050,
      domContentLoaded: 1250,
      firstContentfulPaint: 780,
    }),
    p99: buildMockMetrics({
      pageLoadTime: 1090,
      domContentLoaded: 1290,
      firstContentfulPaint: 795,
    }),
    ...overrides,
  };
}

function buildMockBenchmarkOutput(summaries?: BenchmarkSummary[]) {
  return {
    timestamp: 1700000000000,
    commit: MOCK_COMMIT,
    summary: summaries ?? [buildMockSummary()],
    rawResults: [],
  };
}
describe('formatTime', () => {
  it('returns milliseconds for values under 1000', () => {
    expect(formatTime(500)).toBe('500ms');
  });

  it('rounds millisecond values to nearest integer', () => {
    expect(formatTime(499.7)).toBe('500ms');
  });

  it('returns seconds with two decimal places for values >= 1000', () => {
    expect(formatTime(1500)).toBe('1.50s');
  });

  it('returns "0ms" for zero', () => {
    expect(formatTime(0)).toBe('0ms');
  });

  it('returns "1.00s" at exactly 1000ms', () => {
    expect(formatTime(1000)).toBe('1.00s');
  });

  it('handles large values', () => {
    expect(formatTime(12345)).toBe('12.35s');
  });
});

// ---------------------------------------------------------------------------
// formatStandardDeviation
// ---------------------------------------------------------------------------
describe('formatStandardDeviation', () => {
  it('returns formatted ± string when both values are truthy', () => {
    expect(formatStandardDeviation(1000, 150)).toBe(' (±150ms)');
  });

  it('returns empty string when mean is 0', () => {
    expect(formatStandardDeviation(0, 50)).toBe('');
  });

  it('returns empty string when stdDev is 0', () => {
    expect(formatStandardDeviation(500, 0)).toBe('');
  });

  it('returns empty string when both are 0', () => {
    expect(formatStandardDeviation(0, 0)).toBe('');
  });

  it('formats stdDev in seconds when >= 1000', () => {
    expect(formatStandardDeviation(5000, 1200)).toBe(' (±1.20s)');
  });
});

// ---------------------------------------------------------------------------
// getEmojiForMetric
// ---------------------------------------------------------------------------
describe('getEmojiForMetric', () => {
  describe('pageLoadTime thresholds (good: 1000, warning: 2000)', () => {
    it('returns 🟢 when value is at or below good threshold', () => {
      expect(getEmojiForMetric('pageLoadTime', 1000)).toBe('🟢');
      expect(getEmojiForMetric('pageLoadTime', 500)).toBe('🟢');
    });

    it('returns 🟡 when value is between good and warning', () => {
      expect(getEmojiForMetric('pageLoadTime', 1500)).toBe('🟡');
      expect(getEmojiForMetric('pageLoadTime', 2000)).toBe('🟡');
    });

    it('returns 🔴 when value exceeds warning threshold', () => {
      expect(getEmojiForMetric('pageLoadTime', 2001)).toBe('🔴');
      expect(getEmojiForMetric('pageLoadTime', 5000)).toBe('🔴');
    });
  });

  describe('domContentLoaded thresholds (good: 1200, warning: 2500)', () => {
    it('returns 🟢 at or below 1200', () => {
      expect(getEmojiForMetric('domContentLoaded', 1200)).toBe('🟢');
    });

    it('returns 🟡 between 1200 and 2500', () => {
      expect(getEmojiForMetric('domContentLoaded', 1800)).toBe('🟡');
    });

    it('returns 🔴 above 2500', () => {
      expect(getEmojiForMetric('domContentLoaded', 3000)).toBe('🔴');
    });
  });

  describe('firstContentfulPaint thresholds (good: 800, warning: 1500)', () => {
    it('returns 🟢 at or below 800', () => {
      expect(getEmojiForMetric('firstContentfulPaint', 800)).toBe('🟢');
    });

    it('returns 🟡 between 800 and 1500', () => {
      expect(getEmojiForMetric('firstContentfulPaint', 1000)).toBe('🟡');
    });

    it('returns 🔴 above 1500', () => {
      expect(getEmojiForMetric('firstContentfulPaint', 1600)).toBe('🔴');
    });
  });

  it('returns ⚪ for unknown metrics', () => {
    expect(getEmojiForMetric('unknownMetric', 500)).toBe('⚪');
    expect(getEmojiForMetric('firstPaint', 500)).toBe('⚪');
  });
});

// ---------------------------------------------------------------------------
// getComparisonEmoji
// ---------------------------------------------------------------------------
describe('getComparisonEmoji', () => {
  it('returns ⬇️ when current is lower (improvement)', () => {
    expect(getComparisonEmoji(800, 1000)).toBe('⬇️');
  });

  it('returns ⬆️ when current is higher (regression)', () => {
    expect(getComparisonEmoji(1200, 1000)).toBe('⬆️');
  });

  it('returns ➡️ when values are equal', () => {
    expect(getComparisonEmoji(1000, 1000)).toBe('➡️');
  });
});

// ---------------------------------------------------------------------------
// hasSignificantIncrease
// ---------------------------------------------------------------------------
describe('hasSignificantIncrease', () => {
  describe('pageLoadTime (threshold: 25%)', () => {
    it('returns true when increase meets threshold', () => {
      expect(hasSignificantIncrease('pageLoadTime' as never, 1250, 1000)).toBe(
        true,
      );
    });

    it('returns false when increase is below threshold', () => {
      expect(hasSignificantIncrease('pageLoadTime' as never, 1200, 1000)).toBe(
        false,
      );
    });
  });

  describe('domContentLoaded (threshold: 20%)', () => {
    it('returns true at exactly the threshold', () => {
      expect(
        hasSignificantIncrease('domContentLoaded' as never, 1200, 1000),
      ).toBe(true);
    });

    it('returns false below threshold', () => {
      expect(
        hasSignificantIncrease('domContentLoaded' as never, 1100, 1000),
      ).toBe(false);
    });
  });

  describe('firstContentfulPaint (threshold: 150%)', () => {
    it('returns true for a large increase', () => {
      expect(
        hasSignificantIncrease('firstContentfulPaint' as never, 2500, 1000),
      ).toBe(true);
    });

    it('returns false for moderate increase', () => {
      expect(
        hasSignificantIncrease('firstContentfulPaint' as never, 2000, 1000),
      ).toBe(false);
    });
  });

  it('returns false when current is lower than reference', () => {
    expect(hasSignificantIncrease('pageLoadTime' as never, 800, 1000)).toBe(
      false,
    );
  });
});

describe('getMetricValues', () => {
  it('returns mean and stdDev for a valid metric', () => {
    const summary = buildMockSummary();
    const result = getMetricValues(summary, 'pageLoadTime');

    expect(result).toEqual({ mean: 900, stdDev: 50 });
  });

  it('returns null when the metric is not a number', () => {
    const summary = buildMockSummary({
      mean: { pageLoadTime: undefined } as unknown as BenchmarkMetrics,
    });
    const result = getMetricValues(summary, 'pageLoadTime');

    expect(result).toBeNull();
  });

  it('defaults stdDev to 0 when it is falsy', () => {
    const summary = buildMockSummary({
      mean: buildMockMetrics({ domContentLoaded: 1100 }),
      standardDeviation: {
        domContentLoaded: 0,
      } as unknown as BenchmarkMetrics,
    });
    const result = getMetricValues(summary, 'domContentLoaded');

    expect(result).toEqual({ mean: 1100, stdDev: 0 });
  });
});

describe('aggregateHistoricalBenchmarkData', () => {
  beforeEach(() => {
    jest.spyOn(console, 'log').mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('aggregates mean values across multiple commits', () => {
    const data = {
      commit1: buildMockBenchmarkOutput([
        buildMockSummary({
          mean: buildMockMetrics({ pageLoadTime: 1000 }),
        }),
      ]),
      commit2: buildMockBenchmarkOutput([
        buildMockSummary({
          mean: buildMockMetrics({ pageLoadTime: 800 }),
        }),
      ]),
    };

    const result = aggregateHistoricalBenchmarkData(
      ['commit1', 'commit2'],
      data,
      2,
    );

    const pageSummary = result.summary[0];
    expect(pageSummary.mean.pageLoadTime).toBe(900);
  });

  it('limits to n most recent commits', () => {
    const data = {
      newest: buildMockBenchmarkOutput([
        buildMockSummary({
          mean: buildMockMetrics({ pageLoadTime: 1000 }),
        }),
      ]),
      middle: buildMockBenchmarkOutput([
        buildMockSummary({
          mean: buildMockMetrics({ pageLoadTime: 800 }),
        }),
      ]),
      oldest: buildMockBenchmarkOutput([
        buildMockSummary({
          mean: buildMockMetrics({ pageLoadTime: 600 }),
        }),
      ]),
    };

    const result = aggregateHistoricalBenchmarkData(
      ['newest', 'middle', 'oldest'],
      data,
      2,
    );

    const pageSummary = result.summary[0];
    expect(pageSummary.mean.pageLoadTime).toBe(900);
  });

  it('uses the first commit hash as the representative', () => {
    const data = {
      abc: buildMockBenchmarkOutput(),
      def: buildMockBenchmarkOutput(),
    };

    const result = aggregateHistoricalBenchmarkData(['abc', 'def'], data, 2);

    expect(result.commit).toBe('abc');
  });

  it('handles commits with different pages', () => {
    const data = {
      commit1: buildMockBenchmarkOutput([
        buildMockSummary({
          page: 'home.html',
          mean: buildMockMetrics({ pageLoadTime: 1000 }),
        }),
      ]),
      commit2: buildMockBenchmarkOutput([
        buildMockSummary({
          page: 'popup.html',
          mean: buildMockMetrics({ pageLoadTime: 500 }),
        }),
      ]),
    };

    const result = aggregateHistoricalBenchmarkData(
      ['commit1', 'commit2'],
      data,
      2,
    );

    expect(result.summary).toHaveLength(2);
    const pages = result.summary.map((s) => s.page);
    expect(pages).toContain('home.html');
    expect(pages).toContain('popup.html');
  });

  it('skips commits with missing summary data', () => {
    const data = {
      good: buildMockBenchmarkOutput([
        buildMockSummary({
          mean: buildMockMetrics({ pageLoadTime: 1000 }),
        }),
      ]),
      bad: { timestamp: 0, commit: 'bad', rawResults: [] } as never,
    };

    const result = aggregateHistoricalBenchmarkData(['good', 'bad'], data, 2);

    const pageSummary = result.summary[0];
    expect(pageSummary.mean.pageLoadTime).toBe(1000);
  });
});

describe('generateBenchmarkComment', () => {
  it('returns no-results message when summary is empty', () => {
    const data = buildMockBenchmarkOutput([]);
    const result = generateBenchmarkComment(data);

    expect(result).toContain('No benchmark results available');
  });

  it('returns no-results message when summary is undefined', () => {
    const data = { ...buildMockBenchmarkOutput(), summary: undefined } as never;
    const result = generateBenchmarkComment(data);

    expect(result).toContain('No benchmark results available');
  });

  it('includes commit hash (shortened) and date', () => {
    const data = buildMockBenchmarkOutput();
    const result = generateBenchmarkComment(data);

    expect(result).toContain(MOCK_COMMIT.slice(0, 7));
  });

  it('wraps output in collapsible details tag', () => {
    const data = buildMockBenchmarkOutput();
    const result = generateBenchmarkComment(data);

    expect(result).toMatch(/^<details>/u);
    expect(result).toMatch(/<\/details>$/u);
  });

  it('includes summary header with page name', () => {
    const data = buildMockBenchmarkOutput([
      buildMockSummary({ page: 'test-page.html' }),
    ]);
    const result = generateBenchmarkComment(data);

    expect(result).toContain('test-page.html');
  });

  it('includes detailed results table headers', () => {
    const data = buildMockBenchmarkOutput();
    const result = generateBenchmarkComment(data);

    expect(result).toContain('Detailed Results');
    expect(result).toContain(
      '| Metric | Mean | Std Dev | Min | Max | P95 | P99 |',
    );
  });

  it('renders comparison arrows when reference data is provided', () => {
    const current = buildMockBenchmarkOutput([
      buildMockSummary({
        mean: buildMockMetrics({ pageLoadTime: 900 }),
      }),
    ]);
    const reference = buildMockBenchmarkOutput([
      buildMockSummary({
        mean: buildMockMetrics({ pageLoadTime: 950 }),
      }),
    ]);
    const result = generateBenchmarkComment(current, reference);

    expect(result).toContain('historical');
    expect(result).toContain('⬇️');
  });

  it('falls back to non-comparison rows when reference page is missing', () => {
    const current = buildMockBenchmarkOutput([
      buildMockSummary({ page: 'new-page.html' }),
    ]);
    const reference = buildMockBenchmarkOutput([
      buildMockSummary({ page: 'other-page.html' }),
    ]);
    const result = generateBenchmarkComment(current, reference);

    expect(result).not.toContain('historical');
    expect(result).toContain('new-page.html');
  });

  it('adds performance warning for significant regressions', () => {
    const current = buildMockBenchmarkOutput([
      buildMockSummary({
        mean: buildMockMetrics({ pageLoadTime: 2000 }),
      }),
    ]);
    const reference = buildMockBenchmarkOutput([
      buildMockSummary({
        mean: buildMockMetrics({ pageLoadTime: 800 }),
      }),
    ]);
    const result = generateBenchmarkComment(current, reference);

    expect(result).toContain('Performance Warning');
    expect(result).toContain('regression');
    expect(result).toContain('pageLoadTime');
  });

  it('does not add warning when regressions are below threshold', () => {
    const current = buildMockBenchmarkOutput([
      buildMockSummary({
        mean: buildMockMetrics({ pageLoadTime: 1000 }),
      }),
    ]);
    const reference = buildMockBenchmarkOutput([
      buildMockSummary({
        mean: buildMockMetrics({ pageLoadTime: 950 }),
      }),
    ]);
    const result = generateBenchmarkComment(current, reference);

    expect(result).not.toContain('Performance Warning');
  });
});

