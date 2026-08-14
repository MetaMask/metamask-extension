import { readFile } from 'fs/promises';
import type { BenchmarkResults } from '../../shared/constants/benchmarks';
import * as historicalComparison from './historical-comparison';
import { COMPARISON_SEVERITY } from './comparison-utils';
import {
  BENCHMARK_ANNOUNCE_SECTIONS,
  buildBenchmarkSection,
  extractEntries,
  fetchBenchmarkJson,
  fetchBenchmarkEntries,
  buildPerformanceBenchmarksSection,
  computeEntryHealth,
  EntryHealth,
  getUserJourneyBenchmarkApiModeFromBranch,
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
  buildType: 'webpack',
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
      'webpack',
    );

    expect(entry.benchmarkName).toBe('loadNewAccount');
    expect(entry.presetName).toBe('interactionUserActions');
    expect(entry.platform).toBe('chrome');
    expect(entry.buildType).toBe('webpack');
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
    expect(computeEntryHealth(makeEntry(), BASELINE_METRICS_PASS)).toBe(
      EntryHealth.Pass,
    );
  });

  it('returns pass when p95 is above baseline but within absolute threshold', () => {
    expect(
      computeEntryHealth(
        makeEntry({ p95: { loadNewAccount: 636 } }),
        BASELINE_600['interactionUserActions/loadNewAccount'],
      ),
    ).toBe(EntryHealth.Pass);
  });

  it('returns pass even when p95 is >10% above baseline with no registered threshold', () => {
    expect(
      computeEntryHealth(
        makeEntry({ p95: { loadNewAccount: 672 } }),
        BASELINE_600['interactionUserActions/loadNewAccount'],
      ),
    ).toBe(EntryHealth.Pass);
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

  describe('Layer 1 absolute threshold (standardHome, CI=true)', () => {
    const originalCI = process.env.CI;

    beforeEach(() => {
      process.env.CI = 'true';
    });

    afterEach(() => {
      if (originalCI === undefined) {
        delete process.env.CI;
      } else {
        process.env.CI = originalCI;
      }
    });

    it('returns fail when values exceed the absolute fail threshold', () => {
      const entry = makeEntry({
        benchmarkName: 'startupStandardHome',
        presetName: 'startupStandardHome',
        mean: { uiStartup: 4000 },
        stdDev: { uiStartup: 200 },
        p75: { uiStartup: 4500 },
        p95: { uiStartup: 6000 },
      });
      expect(computeEntryHealth(entry, undefined)).toBe(EntryHealth.Fail);
    });

    it('returns warn when values exceed warn but not fail threshold', () => {
      const entry = makeEntry({
        benchmarkName: 'startupStandardHome',
        presetName: 'startupStandardHome',
        mean: { uiStartup: 2700 },
        stdDev: { uiStartup: 100 },
        p75: { uiStartup: 2700 },
        p95: { uiStartup: 3100 },
      });
      expect(computeEntryHealth(entry, undefined)).toBe(EntryHealth.Warn);
    });

    it('activates CV-adaptive widening when mean and stdDev are forwarded', () => {
      // startupPowerUserHome.uiStartup.p75 → warn 4000, ciMultiplier 2.0.
      // Effective warn without CV widening = 4000 * 2.0 = 8000.
      // CV = 1200/4000 = 30% (in [25, 50] window) → widen by (1 + 30/200) = 1.15.
      // Effective warn with CV widening = 8000 * 1.15 = 9200.
      // A p75 of 9000 warns without widening but passes with widening.
      const entry = makeEntry({
        benchmarkName: 'startupPowerUserHome',
        presetName: 'startupPowerUserHome',
        mean: { uiStartup: 4000 },
        stdDev: { uiStartup: 1200 },
        p75: { uiStartup: 9000 },
        p95: { uiStartup: 10000 },
      });
      expect(computeEntryHealth(entry, undefined)).toBe(EntryHealth.Pass);
    });

    it('excludes metrics with CV > 50% from gating (mirrors validateThresholds)', () => {
      // CV = 3000/5000 = 60% > 50% → unreliable; metric must not be validated.
      // Without the exclusion, p75=15000 exceeds even 2.0x widened warn (8000)
      // and fail (9400) and would misreport as a threshold violation.
      const entry = makeEntry({
        benchmarkName: 'startupPowerUserHome',
        presetName: 'startupPowerUserHome',
        mean: { uiStartup: 5000 },
        stdDev: { uiStartup: 3000 },
        p75: { uiStartup: 15000 },
        p95: { uiStartup: 20000 },
      });
      expect(computeEntryHealth(entry, undefined)).toBe(EntryHealth.Pass);
    });
  });
});

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
        'webpack',
        'myPreset',
      );

      expect(readFile as jest.Mock).toHaveBeenCalledWith(
        '/tmp/benchmarks/benchmark-chrome-webpack-myPreset.json',
        'utf8',
      );
      expect(result).toStrictEqual(MOCK_PAYLOAD);
    });

    it('returns null when the local file does not exist', async () => {
      (readFile as jest.Mock).mockRejectedValue(
        Object.assign(new Error('ENOENT'), { code: 'ENOENT' }),
      );

      expect(
        await fetchBenchmarkJson(HOST, 'chrome', 'webpack', 'missing'),
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
        await fetchBenchmarkJson(HOST, 'chrome', 'webpack', 'myPreset'),
      ).toStrictEqual(MOCK_PAYLOAD);
    });

    it('returns null when fetch returns a non-ok response', async () => {
      mockFetch.mockResolvedValue({ ok: false } as Response);

      expect(
        await fetchBenchmarkJson(HOST, 'chrome', 'webpack', 'myPreset'),
      ).toBeNull();
    });

    it('returns null when fetch throws a network error', async () => {
      mockFetch.mockRejectedValue(new Error('network error'));

      expect(
        await fetchBenchmarkJson(HOST, 'chrome', 'webpack', 'myPreset'),
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

  it('uses custom platforms and buildTypes', async () => {
    mockFetch.mockResolvedValue({ ok: false } as Response);

    const { missingPresets } = await fetchBenchmarkEntries(
      HOST,
      ['myPreset'],
      ['chrome', 'firefox'],
      ['webpack'],
    );

    expect(missingPresets).toHaveLength(2);
    expect(missingPresets).toContain('chrome/webpack/myPreset');
    expect(missingPresets).toContain('firefox/webpack/myPreset');
  });
});

describe('getUserJourneyBenchmarkApiModeFromBranch', () => {
  const saved = () => ({
    BRANCH: process.env.BRANCH,
    GITHUB_HEAD_REF: process.env.GITHUB_HEAD_REF,
    GITHUB_REF_NAME: process.env.GITHUB_REF_NAME,
  });

  const restore = (env: ReturnType<typeof saved>) => {
    for (const key of [
      'BRANCH',
      'GITHUB_HEAD_REF',
      'GITHUB_REF_NAME',
    ] as const) {
      if (env[key] === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = env[key];
      }
    }
  };

  it('returns real for main', () => {
    const before = saved();
    try {
      delete process.env.BRANCH;
      delete process.env.GITHUB_HEAD_REF;
      process.env.GITHUB_REF_NAME = 'main';
      expect(getUserJourneyBenchmarkApiModeFromBranch()).toBe('real');
    } finally {
      restore(before);
    }
  });

  it('returns real for release branches', () => {
    const before = saved();
    try {
      process.env.BRANCH = 'release/12.0.0';
      delete process.env.GITHUB_HEAD_REF;
      delete process.env.GITHUB_REF_NAME;
      expect(getUserJourneyBenchmarkApiModeFromBranch()).toBe('real');
    } finally {
      restore(before);
    }
  });

  it('returns mock for feature branches', () => {
    const before = saved();
    try {
      process.env.BRANCH = 'feature/foo';
      delete process.env.GITHUB_HEAD_REF;
      delete process.env.GITHUB_REF_NAME;
      expect(getUserJourneyBenchmarkApiModeFromBranch()).toBe('mock');
    } finally {
      restore(before);
    }
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
      { entries: [], missingPresets: ['chrome/webpack/foo'] },
      'Test',
    );
    expect(html).toContain('⚠️');
    expect(html).toContain('chrome/webpack/foo');
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

    expect(html).toContain('<summary><b>Test</b></summary>');
    expect(html).toContain('<table style=');
    expect(html).toContain('<th>chrome-webpack</th>');
    expect(html).toContain('<td align="left">loadNewAccount<br>');
    expect(html).toContain('<td align="left">confirmTx<br>');
    expect(html).toContain('[Sentry log · main/release]');
  });

  it('shows 🟢 in the cell when p95 is above baseline but within absolute threshold', () => {
    const html = buildBenchmarkSection(
      withEntries([makeEntry({ p95: { loadNewAccount: 672 } })]),
      'Test',
      BASELINE_600,
    );

    expect(html).toContain(COMPARISON_SEVERITY.Pass.icon);
    expect(html).not.toContain(COMPARISON_SEVERITY.Warn.icon);
  });

  it('shows relative delta in bullet section when p75 is notably above baseline', () => {
    const html = buildBenchmarkSection(
      withEntries([
        makeEntry({
          p75: { loadNewAccount: 700 },
          p95: { loadNewAccount: 720 },
        }),
      ]),
      'Test',
      BASELINE_600,
    );

    expect(html).toContain(
      '📈 Results compared to the previous 5 runs on main',
    );
    expect(html).toContain('loadNewAccount/loadNewAccount');
    expect(html).toContain('+30%');
  });

  it('shows 🟢 for passing entries even when no baseline is given', () => {
    const html = buildBenchmarkSection(withEntries([makeEntry()]), 'Test');
    expect(html).toContain('<table style=');
    expect(html).toContain(COMPARISON_SEVERITY.Pass.icon);
  });

  it('includes mapped sample semantics in the title for announce sections', () => {
    const html = buildBenchmarkSection(
      withEntries([
        makeEntry(),
        makeEntry({
          benchmarkName: 'confirmTx',
          mean: { confirmTx: 1 },
          stdDev: { confirmTx: 1 },
          p75: { confirmTx: 1 },
          p95: { confirmTx: 1 },
        }),
      ]),
      BENCHMARK_ANNOUNCE_SECTIONS.startup,
    );
    expect(html).toContain(
      '<summary><b>Startup Benchmarks · Samples: 100</b></summary>',
    );
  });

  it('uses interaction announce mapping for the Samples line', () => {
    const html = buildBenchmarkSection(
      withEntries([
        makeEntry(),
        makeEntry({
          benchmarkName: 'confirmTx',
          mean: { confirmTx: 1 },
          stdDev: { confirmTx: 1 },
          p75: { confirmTx: 1 },
          p95: { confirmTx: 1 },
        }),
      ]),
      BENCHMARK_ANNOUNCE_SECTIONS.interaction,
    );
    expect(html).toContain(
      '<summary><b>Interaction Benchmarks · Samples: 5</b></summary>',
    );
  });

  it('appends mock API for User Journey when branch is not main or release', () => {
    const saved = {
      BRANCH: process.env.BRANCH,
      GITHUB_HEAD_REF: process.env.GITHUB_HEAD_REF,
      GITHUB_REF_NAME: process.env.GITHUB_REF_NAME,
    };
    try {
      process.env.BRANCH = 'feat/benchmark-tweaks';
      delete process.env.GITHUB_HEAD_REF;
      delete process.env.GITHUB_REF_NAME;
      const html = buildBenchmarkSection(
        withEntries([makeEntry()]),
        BENCHMARK_ANNOUNCE_SECTIONS.userJourney,
      );
      expect(html).toContain(
        '<summary><b>User Journey Benchmarks · Samples: 5 · mock API</b></summary>',
      );
    } finally {
      if (saved.BRANCH === undefined) {
        delete process.env.BRANCH;
      } else {
        process.env.BRANCH = saved.BRANCH;
      }
      if (saved.GITHUB_HEAD_REF === undefined) {
        delete process.env.GITHUB_HEAD_REF;
      } else {
        process.env.GITHUB_HEAD_REF = saved.GITHUB_HEAD_REF;
      }
      if (saved.GITHUB_REF_NAME === undefined) {
        delete process.env.GITHUB_REF_NAME;
      } else {
        process.env.GITHUB_REF_NAME = saved.GITHUB_REF_NAME;
      }
    }
  });

  it('appends real API for User Journey on main', () => {
    const saved = {
      BRANCH: process.env.BRANCH,
      GITHUB_HEAD_REF: process.env.GITHUB_HEAD_REF,
      GITHUB_REF_NAME: process.env.GITHUB_REF_NAME,
    };
    try {
      process.env.BRANCH = 'main';
      delete process.env.GITHUB_HEAD_REF;
      delete process.env.GITHUB_REF_NAME;
      const html = buildBenchmarkSection(
        withEntries([makeEntry()]),
        BENCHMARK_ANNOUNCE_SECTIONS.userJourney,
      );
      expect(html).toContain(
        '<summary><b>User Journey Benchmarks · Samples: 5 · real API</b></summary>',
      );
    } finally {
      if (saved.BRANCH === undefined) {
        delete process.env.BRANCH;
      } else {
        process.env.BRANCH = saved.BRANCH;
      }
      if (saved.GITHUB_HEAD_REF === undefined) {
        delete process.env.GITHUB_HEAD_REF;
      } else {
        process.env.GITHUB_HEAD_REF = saved.GITHUB_HEAD_REF;
      }
      if (saved.GITHUB_REF_NAME === undefined) {
        delete process.env.GITHUB_REF_NAME;
      } else {
        process.env.GITHUB_REF_NAME = saved.GITHUB_REF_NAME;
      }
    }
  });

  it('shows – for combos where a benchmark has no data', () => {
    const html = buildBenchmarkSection(
      withEntries([
        makeEntry({
          benchmarkName: 'loadNewAccount',
          platform: 'chrome',
          buildType: 'webpack',
        }),
        makeEntry({
          benchmarkName: 'confirmTx',
          platform: 'firefox',
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

  it('links each cell to the entry artifact URL as CI log', () => {
    const ARTIFACT =
      'https://cdn.example.com/benchmark-chrome-webpack-foo.json';
    const html = buildBenchmarkSection(
      withEntries([makeEntry({ artifactUrl: ARTIFACT })]),
      'Test',
      BASELINE_PASS,
    );

    expect(html).toContain(`href="${ARTIFACT}"`);
    expect(html).toContain('>[CI log]</a>');
  });

  it('falls back to runUrl for CI log when entry has no artifactUrl', () => {
    const RUN_URL = 'https://github.com/actions/runs/123';
    const html = buildBenchmarkSection(
      withEntries([makeEntry({ p95: { loadNewAccount: 672 } })]),
      'Test',
      BASELINE_600,
      RUN_URL,
    );

    expect(html).toContain(`href="${RUN_URL}"`);
    expect(html).toContain('>[CI log]</a>');
  });

  it('resolves startup baseline via pageLoad/* key format and shows delta in bullet section', () => {
    const entry = makeEntry({
      benchmarkName: 'chrome-webpack-startupStandardHome',
      presetName: 'startupStandardHome',
      mean: { uiStartup: 1800 },
      stdDev: { uiStartup: 100 },
      p75: { uiStartup: 1850 },
      p95: { uiStartup: 1980 },
    });
    const html = buildBenchmarkSection(withEntries([entry]), '🔌 Startup', {
      'pageLoad/chrome-webpack-startupStandardHome': {
        uiStartup: { mean: 1600, stdDev: 80, p75: 1650, p95: 1750 },
      },
    });

    expect(html).toContain(COMPARISON_SEVERITY.Pass.icon);
    expect(html).toContain('startupStandardHome');
    expect(html).toContain(
      '📈 Results compared to the previous 5 runs on main',
    );
    expect(html).toContain('uiStartup');
  });

  it('uses the platform-specific baseline, not the first matching key', () => {
    const firefoxEntry = makeEntry({
      benchmarkName: 'standardHome',
      presetName: 'startupStandardHome',
      platform: 'firefox',
      buildType: 'webpack',
      mean: { uiStartup: 1490 },
      stdDev: { uiStartup: 90 },
      p75: { uiStartup: 1545 },
      p95: { uiStartup: 1600 },
    });
    const html = buildBenchmarkSection(
      withEntries([firefoxEntry]),
      '🔌 Startup',
      {
        'pageLoad/chrome-webpack-startupStandardHome': {
          uiStartup: { mean: 1380, stdDev: 80, p75: 1430, p95: 1500 },
        },
        'pageLoad/firefox-webpack-startupStandardHome': {
          uiStartup: { mean: 1480, stdDev: 90, p75: 1540, p95: 1595 },
        },
      },
    );

    expect(html).toContain(COMPARISON_SEVERITY.Pass.icon);
    expect(html).not.toContain(`${COMPARISON_SEVERITY.Regression.icon} 1`);
  });

  it('skips metrics absent from the baseline (no false positives)', () => {
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
    const html = buildBenchmarkSection(
      withEntries([makeEntry({ p75: {} })]),
      'Test',
      BASELINE_PASS,
    );

    expect(html).not.toContain(`${COMPARISON_SEVERITY.Regression.icon} 1`);
  });

  it('shows 🔴 failure badge when Layer 1 absolute fail threshold is exceeded', () => {
    const entry = makeEntry({
      benchmarkName: 'startupStandardHome',
      presetName: 'startupStandardHome',
      mean: { uiStartup: 4000 },
      stdDev: { uiStartup: 200 },
      p75: { uiStartup: 4500 },
      p95: { uiStartup: 6000 },
    });
    const html = buildBenchmarkSection(withEntries([entry]), 'Test');

    expect(html).toContain(`${COMPARISON_SEVERITY.Regression.icon} 1`);
    expect(html).toContain(COMPARISON_SEVERITY.Regression.icon);
  });

  it('returns "No regressions detected" when no entries exist but baseline is provided', () => {
    const html = buildBenchmarkSection(
      { entries: [], missingPresets: ['chrome/webpack/somePreset'] },
      'Test',
      {
        'some/key': {
          uiStartup: { mean: 500, stdDev: 20, p75: 550, p95: 600 },
        },
      },
    );

    expect(html).toContain('No regressions detected');
  });

  it('returns empty string and logs error when entry processing throws', () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    const badEntry = {
      ...makeEntry(),
      p95: null,
    } as unknown as BenchmarkEntry;

    const html = buildBenchmarkSection(withEntries([badEntry]), 'CrashSection');

    expect(html).toBe('');
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('Failed to build CrashSection'),
    );
    consoleSpy.mockRestore();
  });

  describe('timer details', () => {
    it('shows only failing/warning timers when entry has multiple timers', () => {
      const entry = makeEntry({
        benchmarkName: 'swap',
        mean: {
          openSwapPageFromHome: 310,
          fetchAndDisplaySwapQuotes: 5000,
        },
        p75: {
          openSwapPageFromHome: 340,
          fetchAndDisplaySwapQuotes: 5100,
        },
        p95: {
          openSwapPageFromHome: 400,
          fetchAndDisplaySwapQuotes: 6500,
        },
      });

      const html = buildBenchmarkSection(withEntries([entry]), 'Test');

      expect(html).not.toContain('<code>openSwapPageFromHome</code>');
      expect(html).toContain('<code>fetchAndDisplaySwapQuotes</code>');
    });

    it('shows row health icon and CI log before timer details when breakdown is present', () => {
      const entry = makeEntry({
        benchmarkName: 'swap',
        mean: {
          openSwapPageFromHome: 310,
          fetchAndDisplaySwapQuotes: 5000,
        },
        p75: {
          openSwapPageFromHome: 340,
          fetchAndDisplaySwapQuotes: 5100,
        },
        p95: {
          openSwapPageFromHome: 400,
          fetchAndDisplaySwapQuotes: 6500,
        },
      });

      const runUrl = 'https://github.com/actions/runs/123';
      const html = buildBenchmarkSection(
        withEntries([entry]),
        'Test',
        undefined,
        runUrl,
      );

      const health = computeEntryHealth(entry, undefined);
      let rowIcon: string = COMPARISON_SEVERITY.Pass.icon;
      if (health === EntryHealth.Fail) {
        rowIcon = COMPARISON_SEVERITY.Regression.icon;
      } else if (health === EntryHealth.Warn) {
        rowIcon = COMPARISON_SEVERITY.Warn.icon;
      }

      // Cell layout: `${icon} ${rowLinks}<br>${timerDetails}` (literal <br>, not <br/>)
      expect(html).toContain(`${rowIcon} <a href="${runUrl}"`);
      expect(html).toContain('[CI log]</a><br>');
      expect(html).toContain('<code>fetchAndDisplaySwapQuotes</code>');
    });

    it('shows icon with CI log when no timers present', () => {
      const entry = makeEntry({
        benchmarkName: 'loadNewAccount',
        mean: {},
        p75: {},
        p95: {},
        artifactUrl: 'https://example.com/artifact.json',
      });

      const html = buildBenchmarkSection(withEntries([entry]), 'Test');

      expect(html).toContain('>[CI log]</a>');
      expect(html).toContain(COMPARISON_SEVERITY.Pass.icon);
      expect(html).not.toContain('<ul');
    });

    it('shows per-timer traffic lights based on thresholds (only warnings/failures)', () => {
      const entry = makeEntry({
        benchmarkName: 'onboardingImportWallet',
        mean: {
          importWalletToSocialScreen: 1000,
          doneButtonToHomeScreen: 22000,
        },
        p75: {
          importWalletToSocialScreen: 1200,
          doneButtonToHomeScreen: 22000,
        },
        p95: {
          importWalletToSocialScreen: 1500,
          doneButtonToHomeScreen: 32000,
        },
      });

      const html = buildBenchmarkSection(withEntries([entry]), 'Test');

      expect(html).not.toContain('<code>importWalletToSocialScreen</code>');
      expect(html).toContain('<code>doneButtonToHomeScreen</code>');
      expect(html).toMatch(/🔴 <code>doneButtonToHomeScreen<\/code>/u);
    });

    it('does not show timer details for benchmarks without timer data', () => {
      const entry = makeEntry({
        benchmarkName: 'startupStandardHome',
        mean: { uiStartup: 1500 },
        p75: { uiStartup: 1600 },
        p95: { uiStartup: 1800 },
      });

      const html = buildBenchmarkSection(
        withEntries([entry]),
        'Test',
        undefined,
        'https://github.com/actions/runs/123',
      );

      expect(html).toContain(COMPARISON_SEVERITY.Pass.icon);
      expect(html).toContain('>[CI log]</a>');
      expect(html).not.toContain('<code>uiStartup</code>');
      expect(html).not.toContain('<ul');
    });
  });

  describe('artifact and Sentry links', () => {
    const mockDsn = 'https://fake@metamask.sentry.io/4510302346608640';
    let savedBranch: string | undefined;
    let savedHeadRef: string | undefined;
    let savedRefName: string | undefined;
    let savedSentryDsn: string | undefined;

    beforeEach(() => {
      savedBranch = process.env.BRANCH;
      savedHeadRef = process.env.GITHUB_HEAD_REF;
      savedRefName = process.env.GITHUB_REF_NAME;
      savedSentryDsn = process.env.SENTRY_DSN_PERFORMANCE;
    });

    afterEach(() => {
      if (savedBranch === undefined) {
        delete process.env.BRANCH;
      } else {
        process.env.BRANCH = savedBranch;
      }
      if (savedHeadRef === undefined) {
        delete process.env.GITHUB_HEAD_REF;
      } else {
        process.env.GITHUB_HEAD_REF = savedHeadRef;
      }
      if (savedRefName === undefined) {
        delete process.env.GITHUB_REF_NAME;
      } else {
        process.env.GITHUB_REF_NAME = savedRefName;
      }
      if (savedSentryDsn === undefined) {
        delete process.env.SENTRY_DSN_PERFORMANCE;
      } else {
        process.env.SENTRY_DSN_PERFORMANCE = savedSentryDsn;
      }
    });

    it('includes Sentry Logs Explorer link when BRANCH and SENTRY_DSN_PERFORMANCE are set', () => {
      process.env.BRANCH = 'feat/test';
      process.env.SENTRY_DSN_PERFORMANCE = mockDsn;
      const html = buildBenchmarkSection(
        withEntries([
          makeEntry({ artifactUrl: 'https://cdn.example.com/benchmark.json' }),
        ]),
        'Test',
        BASELINE_PASS,
      );
      expect(html).toContain('>[CI log]</a>');
      expect(html).toContain('>[Sentry log · main/release]</a>');
      expect(html).toContain('metamask.sentry.io/explore/logs');
    });

    it('uses GITHUB_REF_NAME for Sentry when BRANCH is unset', () => {
      delete process.env.BRANCH;
      delete process.env.GITHUB_HEAD_REF;
      process.env.GITHUB_REF_NAME = 'release/1.0.0';
      process.env.SENTRY_DSN_PERFORMANCE = mockDsn;
      const html = buildBenchmarkSection(
        withEntries([
          makeEntry({ artifactUrl: 'https://cdn.example.com/benchmark.json' }),
        ]),
        'Test',
        BASELINE_PASS,
      );
      expect(html).toContain('>[Sentry log · main/release]</a>');
    });

    it('shows Sentry row label as non-link span when SENTRY_DSN_PERFORMANCE is unset', () => {
      process.env.BRANCH = 'feat/test';
      delete process.env.SENTRY_DSN_PERFORMANCE;
      const html = buildBenchmarkSection(
        withEntries([
          makeEntry({ artifactUrl: 'https://cdn.example.com/benchmark.json' }),
        ]),
        'Test',
        BASELINE_PASS,
      );
      expect(html).toContain('>[CI log]</a>');
      expect(html).toContain('[Sentry log · main/release]</span>');
      expect(html).toContain('requires SENTRY_DSN_PERFORMANCE');
      expect(html).not.toContain('metamask.sentry.io/explore/logs');
    });

    it('still includes Sentry row link when branch env vars are unset (ORs main and release/* in URL)', () => {
      // Force-empty so CI-injected GITHUB_HEAD_REF cannot satisfy `||` chain (delete is not always enough).
      process.env.BRANCH = '';
      process.env.GITHUB_HEAD_REF = '';
      process.env.GITHUB_REF_NAME = '';
      process.env.SENTRY_DSN_PERFORMANCE = mockDsn;
      const html = buildBenchmarkSection(
        withEntries([
          makeEntry({ artifactUrl: 'https://cdn.example.com/benchmark.json' }),
        ]),
        'Test',
        BASELINE_PASS,
      );
      expect(html).toContain('>[CI log]</a>');
      expect(html).toContain('metamask.sentry.io/explore/logs');
      expect(html).toContain('ci.branch%3Amain');
      expect(html).toContain('OR+ci.branch%3Arelease%2F*');
      expect(html).toContain('message%3Abenchmark.loadNewAccount');
    });

    it('puts row Sentry under the benchmark name; single CI log above timer detail lines', () => {
      process.env.BRANCH = 'main';
      process.env.SENTRY_DSN_PERFORMANCE = mockDsn;
      const entry = makeEntry({
        benchmarkName: 'swap',
        mean: {
          openSwapPageFromHome: 310,
          fetchAndDisplaySwapQuotes: 5000,
        },
        p75: {
          openSwapPageFromHome: 340,
          fetchAndDisplaySwapQuotes: 5100,
        },
        p95: {
          openSwapPageFromHome: 400,
          fetchAndDisplaySwapQuotes: 6500,
        },
        artifactUrl: 'https://cdn.example.com/swap.json',
      });
      const html = buildBenchmarkSection(
        withEntries([entry]),
        'Test',
        undefined,
        'https://github.com/actions/runs/999',
      );
      expect(html).toContain('<code>fetchAndDisplaySwapQuotes</code>');
      expect(html).toContain('>[CI log]</a>');
      expect(html).toContain(
        'swap<br><a href="https://metamask.sentry.io/explore/logs/',
      );
      expect(html).toContain('message%3Abenchmark.swap');
      expect(html).toContain('>[Sentry log · main/release]</a>');
      expect(html).not.toMatch(
        /<code>fetchAndDisplaySwapQuotes<\/code><br>\[Sentry log/u,
      );
    });
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

  it('includes total pass/warn/fail counts in the outer <summary> tag', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(MOCK_PAYLOAD),
    } as unknown as Response);

    const html = await buildPerformanceBenchmarksSection(HOST);

    expect(html).toMatch(
      new RegExp(
        `<summary>⚡ Performance Benchmarks \\(Total: ${COMPARISON_SEVERITY.Pass.icon} \\d+ pass · ${COMPARISON_SEVERITY.Warn.icon} \\d+ warn · ${COMPARISON_SEVERITY.Regression.icon} \\d+ fail\\)</summary>`,
        'u',
      ),
    );
  });

  it('includes commit information with hash and date from baseline', async () => {
    jest
      .spyOn(historicalComparison, 'fetchHistoricalPerformanceDataFromMain')
      .mockResolvedValue({
        baseline: {},
        latestCommit: 'abc1234567890def',
        latestTimestamp: 1700000000000, // Unix timestamp in milliseconds
      });
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(MOCK_PAYLOAD),
    } as unknown as Response);

    const html = await buildPerformanceBenchmarksSection(HOST);

    expect(html).toContain('<strong>Baseline (latest main)</strong>');
    expect(html).toContain('abc1234');
    expect(html).toContain('<strong>Date</strong>');
  });

  it('links commit hash from baseline data', async () => {
    jest
      .spyOn(historicalComparison, 'fetchHistoricalPerformanceDataFromMain')
      .mockResolvedValue({
        baseline: {},
        latestCommit: 'abc1234567890def',
        latestTimestamp: 1700000000,
      });
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(MOCK_PAYLOAD),
    } as unknown as Response);

    const html = await buildPerformanceBenchmarksSection(HOST);

    expect(html).toContain(
      '<a href="https://github.com/MetaMask/metamask-extension/commit/abc1234567890def">abc1234</a>',
    );
    expect(html).toContain(
      'https://github.com/MetaMask/metamask-extension/commit/abc1234567890def',
    );
  });

  it('includes build logs link when available', async () => {
    process.env.GITHUB_SERVER_URL = 'https://github.com';
    process.env.GITHUB_REPOSITORY = 'MetaMask/metamask-extension';
    process.env.BENCHMARK_WORKFLOW_RUN_ID = '98765';
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(MOCK_PAYLOAD),
    } as unknown as Response);

    const html = await buildPerformanceBenchmarksSection(HOST);

    expect(html).toContain('Pipeline');
    expect(html).toContain(
      '<a href="https://github.com/MetaMask/metamask-extension/actions/runs/98765">98765</a>',
    );
    expect(html).toContain(
      'https://github.com/MetaMask/metamask-extension/actions/runs/98765',
    );
    expect(html).toContain('Baseline logs');

    delete process.env.BENCHMARK_WORKFLOW_RUN_ID;
    delete process.env.GITHUB_SERVER_URL;
    delete process.env.GITHUB_REPOSITORY;
  });

  it('shows regression details when baseline has regressions', async () => {
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
        baseline: {
          'interactionUserActions/loadNewAccount': {
            loadNewAccount: { mean: 540, stdDev: 30, p75: 540, p95: 600 },
          },
        },
        latestCommit: 'abc123',
        latestTimestamp: 1700000000000, // Unix timestamp in milliseconds
      });

    const html = await buildPerformanceBenchmarksSection(HOST);
    expect(html).toContain('loadNewAccount');
  });

  describe('with a Layer 1 threshold failure (CI=true)', () => {
    const originalCI = process.env.CI;

    const FAILING_PAYLOAD = {
      startupStandardHome: {
        testTitle: 'standard-home',
        persona: 'standard',
        platform: 'chrome',
        buildType: 'webpack',
        mean: { uiStartup: 4500 },
        min: { uiStartup: 3000 },
        max: { uiStartup: 7000 },
        stdDev: { uiStartup: 500 },
        p75: { uiStartup: 4500 },
        p95: { uiStartup: 6000 },
      },
    };

    beforeEach(() => {
      process.env.CI = 'true';
    });

    afterEach(() => {
      if (originalCI === undefined) {
        delete process.env.CI;
      } else {
        process.env.CI = originalCI;
      }
    });

    it('renders the failure matrix table with the worst metric label', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(FAILING_PAYLOAD),
      } as unknown as Response);

      const html = await buildPerformanceBenchmarksSection(HOST);

      expect(html).toContain('startupStandardHome');
      expect(html).toContain(COMPARISON_SEVERITY.Regression.icon);
      expect(html).toContain('uiStartup');
    });

    it('renders the regression details inline with the worst label and log link', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(FAILING_PAYLOAD),
      } as unknown as Response);

      const html = await buildPerformanceBenchmarksSection(HOST);

      expect(html).toContain('Regressions');
      expect(html).toContain('startupStandardHome');
    });

    it('includes Sentry Logs Explorer links in matrix and regression list when BRANCH and SENTRY_DSN_PERFORMANCE are set', async () => {
      const mockDsn = 'https://fake@metamask.sentry.io/4510302346608640';
      const savedBranch = process.env.BRANCH;
      const savedSentry = process.env.SENTRY_DSN_PERFORMANCE;
      try {
        process.env.BRANCH = 'main';
        process.env.SENTRY_DSN_PERFORMANCE = mockDsn;
        mockFetch.mockResolvedValue({
          ok: true,
          json: () => Promise.resolve(FAILING_PAYLOAD),
        } as unknown as Response);

        const html = await buildPerformanceBenchmarksSection(HOST);

        expect(html).toContain('>[Sentry log · main/release]</a>');
        expect(html).toContain('metamask.sentry.io/explore/logs');
      } finally {
        if (savedBranch === undefined) {
          delete process.env.BRANCH;
        } else {
          process.env.BRANCH = savedBranch;
        }
        if (savedSentry === undefined) {
          delete process.env.SENTRY_DSN_PERFORMANCE;
        } else {
          process.env.SENTRY_DSN_PERFORMANCE = savedSentry;
        }
      }
    });

    it('exercises getEntryRegressions with baseline data when entry is non-pass', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(FAILING_PAYLOAD),
      } as unknown as Response);

      jest
        .spyOn(historicalComparison, 'fetchHistoricalPerformanceDataFromMain')
        .mockResolvedValue({
          baseline: {
            'pageLoad/chrome-webpack-startupStandardHome': {
              uiStartup: { mean: 1600, stdDev: 100, p75: 1700, p95: 1900 },
            },
          },
          latestCommit: 'abc123',
          latestTimestamp: 1700000000,
        });

      const html = await buildPerformanceBenchmarksSection(HOST);

      expect(html).toContain('startupStandardHome');
      expect(html).toContain(COMPARISON_SEVERITY.Regression.icon);
    });
  });

  describe('commit information', () => {
    const originalSha = process.env.GITHUB_SHA;
    const originalServerUrl = process.env.GITHUB_SERVER_URL;
    const originalRepo = process.env.GITHUB_REPOSITORY;

    afterEach(() => {
      if (originalSha === undefined) {
        delete process.env.GITHUB_SHA;
      } else {
        process.env.GITHUB_SHA = originalSha;
      }
      if (originalServerUrl === undefined) {
        delete process.env.GITHUB_SERVER_URL;
      } else {
        process.env.GITHUB_SERVER_URL = originalServerUrl;
      }
      if (originalRepo === undefined) {
        delete process.env.GITHUB_REPOSITORY;
      } else {
        process.env.GITHUB_REPOSITORY = originalRepo;
      }
    });

    it('includes commit hash and date in the section from baseline', async () => {
      jest
        .spyOn(historicalComparison, 'fetchHistoricalPerformanceDataFromMain')
        .mockResolvedValue({
          baseline: {},
          latestCommit: 'abc1234567890def',
          latestTimestamp: 1700000000000,
        });
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(MOCK_PAYLOAD),
      } as unknown as Response);

      const html = await buildPerformanceBenchmarksSection(HOST);

      expect(html).toContain('<strong>Baseline (latest main)</strong>');
      expect(html).toContain('abc1234');
      expect(html).toContain('<strong>Date</strong>');
    });

    it('links commit hash from baseline data', async () => {
      jest
        .spyOn(historicalComparison, 'fetchHistoricalPerformanceDataFromMain')
        .mockResolvedValue({
          baseline: {},
          latestCommit: 'abc1234567890def',
          latestTimestamp: 1700000000000,
        });
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(MOCK_PAYLOAD),
      } as unknown as Response);

      const html = await buildPerformanceBenchmarksSection(HOST);

      expect(html).toContain(
        '<a href="https://github.com/MetaMask/metamask-extension/commit/abc1234567890def">abc1234</a>',
      );
      expect(html).toContain(
        'https://github.com/MetaMask/metamask-extension/commit/abc1234567890def',
      );
    });

    it('includes build logs link when workflow run ID is available', async () => {
      process.env.GITHUB_SERVER_URL = 'https://github.com';
      process.env.GITHUB_REPOSITORY = 'MetaMask/metamask-extension';
      process.env.BENCHMARK_WORKFLOW_RUN_ID = '12345';
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(MOCK_PAYLOAD),
      } as unknown as Response);

      const html = await buildPerformanceBenchmarksSection(HOST);

      expect(html).toContain('Pipeline');
      expect(html).toContain(
        '<a href="https://github.com/MetaMask/metamask-extension/actions/runs/12345">12345</a>',
      );
      expect(html).toContain(
        'https://github.com/MetaMask/metamask-extension/actions/runs/12345',
      );
      expect(html).toContain('Baseline logs');
    });
  });

  describe('health matrix structure', () => {
    const MATRIX_PAYLOAD = {
      startupStandardHome: {
        testTitle: 'standard-home',
        persona: 'standard',
        platform: 'chrome',
        buildType: 'webpack',
        mean: { uiStartup: 4500 },
        stdDev: { uiStartup: 500 },
        p75: { uiStartup: 4500 },
        p95: { uiStartup: 6000 },
      },
    };

    beforeEach(() => {
      process.env.CI = 'true';
    });

    afterEach(() => {
      delete process.env.CI;
    });

    it('shows benchmarks as rows and browsers as columns', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(MATRIX_PAYLOAD),
      } as unknown as Response);

      const html = await buildPerformanceBenchmarksSection(HOST);

      expect(html).toContain('<th>Benchmark</th>');
      expect(html).toContain('<th>chrome-webpack</th>');
    });

    it('includes clickable log links in matrix cells', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(MATRIX_PAYLOAD),
      } as unknown as Response);

      const html = await buildPerformanceBenchmarksSection(HOST);

      expect(html).toContain('startupStandardHome');
      expect(html).toContain('<a href=');
    });

    it('renders startup benchmark in the matrix with the correct combo column', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(MATRIX_PAYLOAD),
      } as unknown as Response);

      const html = await buildPerformanceBenchmarksSection(HOST);

      expect(html).toContain('startupStandardHome');
      expect(html).toContain(COMPARISON_SEVERITY.Regression.icon);
    });

    it('does not render matrix rows when there are no failures', async () => {
      const passingPayload = {
        startupStandardHome: {
          testTitle: 'standard-home',
          persona: 'standard',
          mean: { uiStartup: 1500 },
          stdDev: { uiStartup: 100 },
          p75: { uiStartup: 1600 },
          p95: { uiStartup: 1800 },
        },
      };
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(passingPayload),
      } as unknown as Response);

      const html = await buildPerformanceBenchmarksSection(HOST);

      expect(html).not.toContain('<th>Metrics</th>');
    });

    it('renders non-startup (interaction) benchmark in the matrix when it fails', async () => {
      /* eslint-disable @typescript-eslint/naming-convention */
      const interactionFailPayload = {
        loadNewAccount: {
          testTitle: 'load-new-account',
          persona: 'standard',
          mean: { load_new_account: 5000 },
          stdDev: { load_new_account: 200 },
          p75: { load_new_account: 9000 },
          p95: { load_new_account: 12000 },
        },
      };
      /* eslint-enable @typescript-eslint/naming-convention */
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(interactionFailPayload),
      } as unknown as Response);

      const html = await buildPerformanceBenchmarksSection(HOST);

      expect(html).toContain('loadNewAccount');
      expect(html).toContain(COMPARISON_SEVERITY.Regression.icon);
    });

    it('renders the matrix header with the correct column label', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(MATRIX_PAYLOAD),
      } as unknown as Response);

      const html = await buildPerformanceBenchmarksSection(HOST);

      expect(html).toContain('<th>Metrics</th>');
      expect(html).toContain('<th>chrome-webpack</th>');
    });
  });
});
