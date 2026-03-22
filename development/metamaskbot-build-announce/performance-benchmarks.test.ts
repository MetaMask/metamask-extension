import { readFile } from 'fs/promises';
import type { BenchmarkResults } from '../../shared/constants/benchmarks';
import * as historicalComparison from './historical-comparison';
import { COMPARISON_SEVERITY } from './comparison-utils';
import {
  buildBenchmarkSection,
  extractEntries,
  fetchBenchmarkJson,
  fetchBenchmarkEntries,
  buildPerformanceBenchmarksSection,
  computeEntryHealth,
  EntryHealth,
  type FetchBenchmarkResult,
  type BenchmarkEntry,
} from './performance-benchmarks';

jest.mock('fs/promises');

const makeEntry = (
  overrides: Partial<BenchmarkEntry> = {},
): BenchmarkEntry => ({
  benchmarkName: 'loadNewAccount',
  presetName: 'interactionUserActions',
  platform: 'chrome',
  buildType: 'browserify',
  mean: { loadNewAccount: 523 },
  stdDev: { loadNewAccount: 45 },
  p75: { loadNewAccount: 550 },
  p95: { loadNewAccount: 612 },
  ...overrides,
});

const withEntries = (entries: BenchmarkEntry[]): FetchBenchmarkResult => ({
  entries,
  missingPresets: [],
});

const BASELINE_METRICS_PASS = {
  loadNewAccount: { mean: 540, stdDev: 45, p75: 560, p95: 620 },
};
const BASELINE_PASS = {
  'interactionUserActions/loadNewAccount': BASELINE_METRICS_PASS,
};

const BASELINE_600 = {
  'interactionUserActions/loadNewAccount': {
    loadNewAccount: { mean: 540, stdDev: 30, p75: 540, p95: 600 },
  },
};

const MOCK_PAYLOAD: Record<string, BenchmarkResults> = {
  loadNewAccount: {
    testTitle: 'benchmark-load-new-account',
    persona: 'standard',
    mean: { loadNewAccount: 523 },
    min: { loadNewAccount: 480 },
    max: { loadNewAccount: 620 },
    stdDev: { loadNewAccount: 45 },
    p75: { loadNewAccount: 550 },
    p95: { loadNewAccount: 612 },
  },
};

describe('extractEntries', () => {
  it('maps entries, propagating presetName, platform, and buildType', () => {
    const [entry] = extractEntries(
      MOCK_PAYLOAD,
      'interactionUserActions',
      'chrome',
      'browserify',
    );

    expect(entry.benchmarkName).toBe('loadNewAccount');
    expect(entry.presetName).toBe('interactionUserActions');
    expect(entry.platform).toBe('chrome');
    expect(entry.buildType).toBe('browserify');
  });

  it('includes mean/stdDev/p75/p95 and excludes min/max', () => {
    const [entry] = extractEntries(MOCK_PAYLOAD);

    expect(entry.mean).toStrictEqual({ loadNewAccount: 523 });
    expect(entry.stdDev).toStrictEqual({ loadNewAccount: 45 });
    expect(entry.p75).toStrictEqual({ loadNewAccount: 550 });
    expect(entry.p95).toStrictEqual({ loadNewAccount: 612 });
    expect(entry).not.toHaveProperty('min');
    expect(entry).not.toHaveProperty('max');
  });

  it('defaults presetName, platform, and buildType to empty string', () => {
    const [entry] = extractEntries(MOCK_PAYLOAD);

    expect(entry.presetName).toBe('');
    expect(entry.platform).toBe('');
    expect(entry.buildType).toBe('');
  });

  it('filters out null entries', () => {
    const entries = extractEntries({
      nullEntry: null,
      valid: MOCK_PAYLOAD.loadNewAccount,
    });

    expect(entries).toHaveLength(1);
    expect(entries[0].benchmarkName).toBe('valid');
  });
});

describe('computeEntryHealth', () => {
  it('returns pass when no baseline is provided', () => {
    expect(computeEntryHealth(makeEntry(), undefined)).toBe(EntryHealth.Pass);
  });

  it('returns pass when metrics are within threshold', () => {
    // p95=612 vs baseline 620 → -1.3% → neutral
    expect(computeEntryHealth(makeEntry(), BASELINE_METRICS_PASS)).toBe(
      EntryHealth.Pass,
    );
  });

  it('returns warn when p95 is 5–10% above baseline (Layer 2 relative context)', () => {
    // 636 vs 600 → +6% → relative warn, capped at Warn (no absolute threshold for this benchmark)
    expect(
      computeEntryHealth(
        makeEntry({ p95: { loadNewAccount: 636 } }),
        BASELINE_600['interactionUserActions/loadNewAccount'],
      ),
    ).toBe(EntryHealth.Warn);
  });

  it('returns warn when p95 is >10% above baseline with no registered threshold', () => {
    // 672 vs 600 → +12%
    expect(
      computeEntryHealth(
        makeEntry({ p95: { loadNewAccount: 672 } }),
        BASELINE_600['interactionUserActions/loadNewAccount'],
      ),
    ).toBe(EntryHealth.Warn); // Layer 1 not registered → capped at Warn by Layer 2
  });

  it('returns pass when the metric key is absent from baseline', () => {
    expect(
      computeEntryHealth(makeEntry(), {
        differentMetric: { mean: 600, stdDev: 44, p75: 620, p95: 680 },
      }),
    ).toBe(EntryHealth.Pass);
  });

  it('skips a percentile when its value is absent from the entry', () => {
    expect(
      computeEntryHealth(makeEntry({ p75: {} }), BASELINE_METRICS_PASS),
    ).toBe(EntryHealth.Pass);
  });
});

// ─── fetchBenchmarkJson ───────────────────────────────────────────────────────

describe('fetchBenchmarkJson', () => {
  const HOST = 'https://ci.example.com';
  const mockFetch = jest.fn();

  afterEach(() => {
    mockFetch.mockReset();
    (readFile as jest.Mock).mockReset();
  });

  describe('local filesystem (BENCHMARK_RESULTS_DIR set)', () => {
    beforeEach(() => {
      process.env.BENCHMARK_RESULTS_DIR = '/tmp/benchmarks';
    });

    afterEach(() => {
      delete process.env.BENCHMARK_RESULTS_DIR;
    });

    it('reads and parses JSON from the correct local file path', async () => {
      (readFile as jest.Mock).mockResolvedValue(JSON.stringify(MOCK_PAYLOAD));

      const result = await fetchBenchmarkJson(
        HOST,
        'chrome',
        'browserify',
        'myPreset',
      );

      expect(readFile as jest.Mock).toHaveBeenCalledWith(
        '/tmp/benchmarks/benchmark-chrome-browserify-myPreset.json',
        'utf8',
      );
      expect(result).toStrictEqual(MOCK_PAYLOAD);
    });

    it('returns null when the local file does not exist', async () => {
      (readFile as jest.Mock).mockRejectedValue(
        Object.assign(new Error('ENOENT'), { code: 'ENOENT' }),
      );

      expect(
        await fetchBenchmarkJson(HOST, 'chrome', 'browserify', 'missing'),
      ).toBeNull();
    });
  });

  describe('HTTP fetch fallback (BENCHMARK_RESULTS_DIR not set)', () => {
    beforeEach(() => {
      global.fetch = mockFetch;
    });

    it('returns parsed JSON when fetch succeeds', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(MOCK_PAYLOAD),
      } as unknown as Response);

      expect(
        await fetchBenchmarkJson(HOST, 'chrome', 'browserify', 'myPreset'),
      ).toStrictEqual(MOCK_PAYLOAD);
    });

    it('returns null when fetch returns a non-ok response', async () => {
      mockFetch.mockResolvedValue({ ok: false } as Response);

      expect(
        await fetchBenchmarkJson(HOST, 'chrome', 'browserify', 'myPreset'),
      ).toBeNull();
    });

    it('returns null when fetch throws a network error', async () => {
      mockFetch.mockRejectedValue(new Error('network error'));

      expect(
        await fetchBenchmarkJson(HOST, 'chrome', 'browserify', 'myPreset'),
      ).toBeNull();
    });
  });
});

describe('fetchBenchmarkEntries', () => {
  const HOST = 'https://ci.example.com';
  const mockFetch = jest.fn();

  beforeEach(() => {
    global.fetch = mockFetch;
  });

  afterEach(() => {
    mockFetch.mockReset();
  });

  it('returns entries with preset, platform, and buildType on success', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(MOCK_PAYLOAD),
    } as unknown as Response);

    const { entries, missingPresets } = await fetchBenchmarkEntries(HOST, [
      'interactionUserActions',
    ]);

    expect(entries[0].benchmarkName).toBe('loadNewAccount');
    expect(entries[0].presetName).toBe('interactionUserActions');
    expect(entries[0].platform).toBeTruthy();
    expect(entries[0].buildType).toBeTruthy();
    expect(missingPresets).toHaveLength(0);
  });

  it('records missing presets when fetch fails', async () => {
    mockFetch.mockResolvedValue({ ok: false } as Response);

    const { entries, missingPresets } = await fetchBenchmarkEntries(HOST, [
      'interactionUserActions',
    ]);

    expect(entries).toHaveLength(0);
    expect(missingPresets[0]).toContain('interactionUserActions');
  });

  it('uses custom platforms and buildTypes (2 × 2 × 1 = 4 combinations)', async () => {
    mockFetch.mockResolvedValue({ ok: false } as Response);

    const { missingPresets } = await fetchBenchmarkEntries(
      HOST,
      ['myPreset'],
      ['chrome', 'firefox'],
      ['browserify', 'webpack'],
    );

    expect(missingPresets).toHaveLength(4);
    expect(missingPresets).toContain('chrome/browserify/myPreset');
    expect(missingPresets).toContain('firefox/webpack/myPreset');
  });
});

describe('buildBenchmarkSection', () => {
  it('returns empty string when there are no entries and no missing presets', () => {
    expect(
      buildBenchmarkSection({ entries: [], missingPresets: [] }, 'Test'),
    ).toBe('');
  });

  it('surfaces ⚠️ warning for missing presets', () => {
    const html = buildBenchmarkSection(
      { entries: [], missingPresets: ['chrome/browserify/foo'] },
      'Test',
    );
    expect(html).toContain('⚠️');
    expect(html).toContain('chrome/browserify/foo');
  });

  it('renders a table with benchmark rows and combo columns', () => {
    const html = buildBenchmarkSection(
      withEntries([
        makeEntry({ benchmarkName: 'loadNewAccount' }),
        makeEntry({
          benchmarkName: 'confirmTx',
          mean: { confirmTx: 500 },
          stdDev: { confirmTx: 30 },
          p75: { confirmTx: 520 },
          p95: { confirmTx: 540 },
        }),
      ]),
      'Test',
      BASELINE_PASS,
    );

    expect(html).toContain('<table>');
    expect(html).toContain('<th>chrome-browserify</th>');
    expect(html).toContain('<td>loadNewAccount</td>');
    expect(html).toContain('<td>confirmTx</td>');
  });

  it('shows 🟡 in the cell when p95 is >10% above baseline (no absolute threshold → Layer 2 caps at Warn)', () => {
    // 672 vs 600 → +12% relative regression, but loadNewAccount has no THRESHOLD_REGISTRY entry
    // → Layer 1 skipped, Layer 2 result capped at Warn
    const html = buildBenchmarkSection(
      withEntries([makeEntry({ p95: { loadNewAccount: 672 } })]),
      'Test',
      BASELINE_600,
    );

    expect(html).toContain(COMPARISON_SEVERITY.Warn.icon);
    expect(html).not.toContain(`${COMPARISON_SEVERITY.Regression.icon} 1`);
  });

  it('shows 🟡 in the cell and no failure badge when p95 is 5–10% above baseline', () => {
    // 636 vs 600 → +6% → warn
    const html = buildBenchmarkSection(
      withEntries([makeEntry({ p95: { loadNewAccount: 636 } })]),
      'Test',
      BASELINE_600,
    );

    expect(html).toContain(COMPARISON_SEVERITY.Warn.icon);
    expect(html).not.toContain(`${COMPARISON_SEVERITY.Regression.icon} 1`);
  });

  it('shows 🟢 for passing entries even when no baseline is given', () => {
    const html = buildBenchmarkSection(withEntries([makeEntry()]), 'Test');

    expect(html).toContain('<table>');
    expect(html).toContain(COMPARISON_SEVERITY.Pass.icon);
  });

  it('shows – for combos where a benchmark has no data', () => {
    const html = buildBenchmarkSection(
      withEntries([
        makeEntry({
          benchmarkName: 'loadNewAccount',
          platform: 'chrome',
          buildType: 'browserify',
        }),
        makeEntry({
          benchmarkName: 'confirmTx',
          platform: 'chrome',
          buildType: 'webpack',
          mean: { confirmTx: 500 },
          stdDev: { confirmTx: 30 },
          p75: { confirmTx: 520 },
          p95: { confirmTx: 540 },
        }),
      ]),
      'Test',
      BASELINE_PASS,
    );

    expect(html).toContain('–');
  });

  it('links each cell to the entry artifact URL as [Show logs]', () => {
    const ARTIFACT =
      'https://cdn.example.com/benchmark-chrome-browserify-foo.json';
    const html = buildBenchmarkSection(
      withEntries([makeEntry({ artifactUrl: ARTIFACT })]),
      'Test',
      BASELINE_PASS,
    );

    expect(html).toContain(`href="${ARTIFACT}"`);
    expect(html).toContain('[Show logs]');
  });

  it('falls back to runUrl for [Show logs] when entry has no artifactUrl', () => {
    const RUN_URL = 'https://github.com/actions/runs/123';
    const html = buildBenchmarkSection(
      withEntries([makeEntry({ p95: { loadNewAccount: 672 } })]),
      'Test',
      BASELINE_600,
      RUN_URL,
    );

    expect(html).toContain(`href="${RUN_URL}"`);
    expect(html).toContain('[Show logs]');
  });

  it('resolves startup baseline via pageLoad/* substring key format', () => {
    // p95=1980 vs baseline 1750 → +13% → no absolute threshold → Layer 2 → 🟡 warn
    const entry = makeEntry({
      benchmarkName: 'standardHome',
      presetName: 'startupStandardHome',
      mean: { uiStartup: 1800 },
      stdDev: { uiStartup: 100 },
      p75: { uiStartup: 1850 },
      p95: { uiStartup: 1980 },
    });
    const html = buildBenchmarkSection(withEntries([entry]), '🔌 Startup', {
      'pageLoad/chrome-browserify-startupStandardHome': {
        uiStartup: { mean: 1600, stdDev: 80, p75: 1650, p95: 1750 },
      },
    });

    expect(html).toContain(COMPARISON_SEVERITY.Warn.icon);
    expect(html).toContain('standardHome');
  });

  it('uses the platform-specific baseline, not the first matching key', () => {
    // Firefox p95=1600 vs its own baseline 1595 → +0.3% → 🟢
    // Without the fix it would compare against chrome baseline 1500 → +7% → 🟡
    const firefoxEntry = makeEntry({
      benchmarkName: 'standardHome',
      presetName: 'startupStandardHome',
      platform: 'firefox',
      buildType: 'browserify',
      mean: { uiStartup: 1490 },
      stdDev: { uiStartup: 90 },
      p75: { uiStartup: 1545 },
      p95: { uiStartup: 1600 },
    });
    const html = buildBenchmarkSection(
      withEntries([firefoxEntry]),
      '🔌 Startup',
      {
        'pageLoad/chrome-browserify-startupStandardHome': {
          uiStartup: { mean: 1380, stdDev: 80, p75: 1430, p95: 1500 },
        },
        'pageLoad/firefox-browserify-startupStandardHome': {
          uiStartup: { mean: 1480, stdDev: 90, p75: 1540, p95: 1595 },
        },
      },
    );

    expect(html).toContain(COMPARISON_SEVERITY.Pass.icon);
    expect(html).not.toContain(`${COMPARISON_SEVERITY.Regression.icon} 1`);
  });

  it('skips metrics absent from the baseline (no false positives)', () => {
    // otherMetric not in baseline → ignored, loadNewAccount passes → no failure badge
    const entry = makeEntry({
      p95: { loadNewAccount: 612, otherMetric: 100 },
      p75: { loadNewAccount: 550, otherMetric: 80 },
    });
    const html = buildBenchmarkSection(
      withEntries([entry]),
      'Test',
      BASELINE_PASS,
    );

    expect(html).not.toContain(`${COMPARISON_SEVERITY.Regression.icon} 1`);
  });

  it('skips a percentile when its value is absent from the entry', () => {
    // p75={} → p75 skipped; p95 still within threshold → no failure
    const html = buildBenchmarkSection(
      withEntries([makeEntry({ p75: {} })]),
      'Test',
      BASELINE_PASS,
    );

    expect(html).not.toContain(`${COMPARISON_SEVERITY.Regression.icon} 1`);
  });
});

describe('buildPerformanceBenchmarksSection', () => {
  const HOST = 'https://ci.example.com';
  const mockFetch = jest.fn();

  beforeEach(() => {
    global.fetch = mockFetch;
    jest
      .spyOn(historicalComparison, 'fetchHistoricalPerformanceDataFromMain')
      .mockResolvedValue(null);
  });

  afterEach(() => {
    mockFetch.mockReset();
    jest.restoreAllMocks();
  });

  it('returns empty string when all fetches return empty data', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({}),
    } as unknown as Response);

    expect(await buildPerformanceBenchmarksSection(HOST)).toBe('');
  });

  it('returns section with ⚠️ warnings when fetches fail', async () => {
    mockFetch.mockResolvedValue({ ok: false } as Response);

    const html = await buildPerformanceBenchmarksSection(HOST);

    expect(html).toContain('⚡ Performance Benchmarks');
    expect(html).toContain('Missing data');
  });

  it('wraps content in an ⚡ Performance Benchmarks collapsible on success', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(MOCK_PAYLOAD),
    } as unknown as Response);

    const html = await buildPerformanceBenchmarksSection(HOST);

    expect(html).toContain('<details>');
    expect(html).toContain('⚡ Performance Benchmarks');
  });

  it('includes the health legend badge in the outer <summary> tag', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(MOCK_PAYLOAD),
    } as unknown as Response);

    const html = await buildPerformanceBenchmarksSection(HOST);

    expect(html).toContain(
      `<summary>⚡ Performance Benchmarks (${COMPARISON_SEVERITY.Pass.icon} pass · ${COMPARISON_SEVERITY.Warn.icon} warn · ${COMPARISON_SEVERITY.Regression.icon} fail)</summary>`,
    );
  });

  it('shows regression details when baseline has regressions', async () => {
    // p95=672 vs baseline 600 → +12% → regression
    mockFetch.mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          ...MOCK_PAYLOAD,
          loadNewAccount: {
            ...MOCK_PAYLOAD.loadNewAccount,
            p95: { loadNewAccount: 672 },
          },
        }),
    } as unknown as Response);

    jest
      .spyOn(historicalComparison, 'fetchHistoricalPerformanceDataFromMain')
      .mockResolvedValue({
        'interactionUserActions/loadNewAccount': {
          loadNewAccount: { mean: 540, stdDev: 30, p75: 540, p95: 600 },
        },
      });

    const html = await buildPerformanceBenchmarksSection(HOST);
    expect(html).toContain('loadNewAccount');
  });
});
