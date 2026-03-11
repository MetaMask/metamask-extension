import type { BenchmarkResults } from '../../shared/constants/benchmarks';
import * as historicalComparison from './historical-comparison';
import {
  buildTableRows,
  buildBenchmarkSection,
  extractEntries,
  fetchBenchmarkEntries,
  buildPerformanceBenchmarksSection,
  type FetchBenchmarkResult,
  type BenchmarkEntry,
} from './performance-benchmarks';

const mockUserActionsJson: Record<string, BenchmarkResults> = {
  loadNewAccount: {
    testTitle: 'benchmark-user-actions-load-new-account',
    persona: 'standard',
    mean: { loadNewAccount: 523.4 },
    min: { loadNewAccount: 480 },
    max: { loadNewAccount: 620 },
    stdDev: { loadNewAccount: 45.2 },
    p75: { loadNewAccount: 550 },
    p95: { loadNewAccount: 612 },
  },
  confirmTx: {
    testTitle: 'benchmark-user-actions-confirm-tx',
    persona: 'standard',
    mean: { confirmTx: 3456.7 },
    min: { confirmTx: 3100 },
    max: { confirmTx: 3900 },
    stdDev: { confirmTx: 210.3 },
    p75: { confirmTx: 3600 },
    p95: { confirmTx: 3812 },
  },
  bridgeUserActions: {
    testTitle: 'benchmark-user-actions-bridge',
    persona: 'standard',
    mean: { bridgePageLoad: 200.1, bridgeTokenSwitch: 150.8 },
    min: { bridgePageLoad: 180, bridgeTokenSwitch: 130 },
    max: { bridgePageLoad: 260, bridgeTokenSwitch: 190 },
    stdDev: { bridgePageLoad: 18.5, bridgeTokenSwitch: 12.3 },
    p75: { bridgePageLoad: 215, bridgeTokenSwitch: 160 },
    p95: { bridgePageLoad: 245, bridgeTokenSwitch: 178 },
  },
};

const mockPerformanceOnboardingJson: Record<string, BenchmarkResults> = {
  onboardingImportWallet: {
    testTitle: 'benchmark-onboarding-import-wallet',
    persona: 'standard',
    mean: {
      importWalletToSocialScreen: 209,
      srpButtonToSrpForm: 53,
      confirmSrpToPasswordForm: 150,
      doneButtonToHomeScreen: 8500,
    },
    min: {
      importWalletToSocialScreen: 170,
      srpButtonToSrpForm: 40,
      confirmSrpToPasswordForm: 120,
      doneButtonToHomeScreen: 7500,
    },
    max: {
      importWalletToSocialScreen: 310,
      srpButtonToSrpForm: 80,
      confirmSrpToPasswordForm: 210,
      doneButtonToHomeScreen: 11000,
    },
    stdDev: {
      importWalletToSocialScreen: 32,
      srpButtonToSrpForm: 8,
      confirmSrpToPasswordForm: 20,
      doneButtonToHomeScreen: 600,
    },
    p75: {
      importWalletToSocialScreen: 230,
      srpButtonToSrpForm: 58,
      confirmSrpToPasswordForm: 165,
      doneButtonToHomeScreen: 9000,
    },
    p95: {
      importWalletToSocialScreen: 280,
      srpButtonToSrpForm: 70,
      confirmSrpToPasswordForm: 195,
      doneButtonToHomeScreen: 10200,
    },
  },
};

const mockPerformanceAssetsJson: Record<string, BenchmarkResults> = {
  assetDetails: {
    testTitle: 'benchmark-asset-details',
    persona: 'powerUser',
    mean: { assetClickToPriceChart: 4200 },
    min: { assetClickToPriceChart: 3800 },
    max: { assetClickToPriceChart: 5500 },
    stdDev: { assetClickToPriceChart: 350 },
    p75: { assetClickToPriceChart: 4500 },
    p95: { assetClickToPriceChart: 5100 },
  },
};

describe('extractEntries', () => {
  it('maps all entries from the data object', () => {
    const entries = extractEntries(mockUserActionsJson);
    expect(entries).toHaveLength(Object.keys(mockUserActionsJson).length);
    expect(entries.map((e) => e.benchmarkName)).toContain('loadNewAccount');
    expect(entries.map((e) => e.benchmarkName)).toContain('confirmTx');
  });

  it('extracts all statistical fields', () => {
    const entries = extractEntries({
      loadNewAccount: mockUserActionsJson.loadNewAccount,
    });

    expect(entries).toHaveLength(1);
    expect(entries[0].mean).toStrictEqual({ loadNewAccount: 523.4 });
    expect(entries[0].min).toStrictEqual({ loadNewAccount: 480 });
    expect(entries[0].max).toStrictEqual({ loadNewAccount: 620 });
    expect(entries[0].stdDev).toStrictEqual({ loadNewAccount: 45.2 });
    expect(entries[0].p75).toStrictEqual({ loadNewAccount: 550 });
    expect(entries[0].p95).toStrictEqual({ loadNewAccount: 612 });
  });

  it('filters out entries with null mean', () => {
    const entries = extractEntries({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      nullMean: { ...mockUserActionsJson.loadNewAccount, mean: null as any },
      loadNewAccount: mockUserActionsJson.loadNewAccount,
    });

    expect(entries).toHaveLength(1);
    expect(entries[0].benchmarkName).toBe('loadNewAccount');
  });

  it('filters out entries with undefined mean', () => {
    const entries = extractEntries({
      undefinedMean: {
        ...mockUserActionsJson.loadNewAccount,
        mean: undefined as unknown as BenchmarkResults['mean'],
      },
      loadNewAccount: mockUserActionsJson.loadNewAccount,
    });

    expect(entries).toHaveLength(1);
    expect(entries[0].benchmarkName).toBe('loadNewAccount');
  });
});

describe('buildTableRows', () => {
  it('produces one row per metric for a single entry', () => {
    // loadNewAccount entry has one metric key: 'loadNewAccount'
    const [entry] = extractEntries({
      loadNewAccount: mockUserActionsJson.loadNewAccount,
    });
    const rows = buildTableRows(entry);

    expect(rows).toHaveLength(1);
  });

  it('renders loadNewAccount row in 3-column format (Step | Result | P95)', () => {
    const [entry] = extractEntries({
      loadNewAccount: mockUserActionsJson.loadNewAccount,
    });
    const [row] = buildTableRows(entry);

    // Step cell: metric key only (no benchmark name in row)
    expect(row).toContain('loadNewAccount');
    expect(row).not.toContain('Load New Account');
    // Result cell: mean value + ' ms' (no baseline → no indicator)
    expect(row).toContain('523 ms');
    // P95 cell: raw number
    expect(row).toContain('>612<');
    // No Min / Max / Std Dev / P75 columns
    expect(row).not.toContain('>480<');
    expect(row).not.toContain('>620<');
    expect(row).not.toContain('>550<');
  });

  it('renders confirmTx row with correct rounded values', () => {
    const [entry] = extractEntries({
      confirmTx: mockUserActionsJson.confirmTx,
    });
    const [row] = buildTableRows(entry);

    expect(row).toContain('confirmTx');
    expect(row).not.toContain('Confirm Tx');
    expect(row).toContain('3457 ms');
    expect(row).toContain('>3812<');
  });

  it('renders multi-metric entry with one row per metric', () => {
    const [entry] = extractEntries({
      bridgeUserActions: mockUserActionsJson.bridgeUserActions,
    });
    const rows = buildTableRows(entry);

    expect(rows).toHaveLength(2);
    expect(rows[0]).toContain('bridgePageLoad');
    expect(rows[0]).toContain('200 ms');
    expect(rows[0]).toContain('>245<');

    expect(rows[1]).toContain('bridgeTokenSwitch');
    expect(rows[1]).toContain('151 ms');
    expect(rows[1]).toContain('>178<');
  });

  it('renders onboarding metrics with correct step values', () => {
    const [entry] = extractEntries(mockPerformanceOnboardingJson);
    const rows = buildTableRows(entry);

    expect(rows).toHaveLength(4);
    expect(rows[0]).not.toContain('rowspan');
    expect(rows[0]).toContain('importWalletToSocialScreen');
    expect(rows[0]).toContain('209 ms');
    expect(rows[0]).toContain('>280<');

    expect(rows[1]).toContain('srpButtonToSrpForm');
    expect(rows[1]).toContain('53 ms');
    expect(rows[1]).toContain('>70<');
  });

  it('orders total metric last and bolds it', () => {
    const entry: BenchmarkEntry = {
      benchmarkName: 'loadNewAccount',
      presetName: '',
      mean: { total: 275, loadNewAccount: 275 },
      min: {},
      max: {},
      stdDev: {},
      p75: {},
      p95: { total: 279, loadNewAccount: 279 },
    };
    const rows = buildTableRows(entry);

    // total row should be last
    expect(rows).toHaveLength(2);
    expect(rows[rows.length - 1]).toContain('<b>total</b>');
    expect(rows[0]).not.toContain('<b>total</b>');
  });

  it('renders dash when a metric key is missing from p95', () => {
    const entry: BenchmarkEntry = {
      benchmarkName: 'partialStats',
      presetName: '',
      mean: { myMetric: 100 },
      min: {},
      max: {},
      stdDev: {},
      p75: {},
      p95: {},
    };
    const rows = buildTableRows(entry);

    expect(rows).toHaveLength(1);
    expect(rows[0]).toContain('100 ms');
    expect(rows[0]).toContain('>-<');
  });
});

describe('buildBenchmarkSection', () => {
  const noMissing = (
    entries: ReturnType<typeof extractEntries>,
  ): FetchBenchmarkResult => ({
    entries,
    missingPresets: [],
  });

  describe('interaction benchmarks', () => {
    const result = noMissing(extractEntries(mockUserActionsJson));

    it('wraps content in a collapsible details section', () => {
      const html = buildBenchmarkSection(result, '👆 Interaction Benchmarks');

      expect(html).toContain('<details>');
      expect(html).toContain('👆 Interaction Benchmarks');
      expect(html).toContain('<table>');
      expect(html).toContain('</details>');
    });

    it('uses 3-column headers: Step | Result | P95 (ms)', () => {
      const html = buildBenchmarkSection(result, '👆 Interaction Benchmarks');

      expect(html).toContain('>Step<');
      expect(html).toContain('>Result<');
      expect(html).toContain('>P95 (ms)<');
      // Removed columns
      expect(html).not.toContain('>Benchmark / Metric<');
      expect(html).not.toContain('>Mean (ms)<');
      expect(html).not.toContain('>Min (ms)<');
      expect(html).not.toContain('>P75 (ms)<');
    });

    it('renders benchmark names as h4 section headers', () => {
      const html = buildBenchmarkSection(result, '👆 Interaction Benchmarks');

      expect(html).toContain('<h4>Load New Account</h4>');
      expect(html).toContain('<h4>Confirm Tx</h4>');
      expect(html).toContain('<h4>Bridge User Actions</h4>');
    });

    it('returns empty string when no entries and no missing presets', () => {
      const empty: FetchBenchmarkResult = { entries: [], missingPresets: [] };
      expect(buildBenchmarkSection(empty, '👆 Interaction Benchmarks')).toBe(
        '',
      );
    });
  });

  describe('user journey benchmarks', () => {
    const entries = [
      ...extractEntries(mockPerformanceOnboardingJson),
      ...extractEntries(mockPerformanceAssetsJson),
    ];
    const result = noMissing(entries);

    it('wraps content in a collapsible details section', () => {
      const html = buildBenchmarkSection(result, '🧭 User Journey Benchmarks');

      expect(html).toContain('<details>');
      expect(html).toContain('🧭 User Journey Benchmarks');
      expect(html).toContain('<table>');
      expect(html).toContain('</details>');
    });

    it('renders each benchmark as its own h4-headed sub-section', () => {
      const html = buildBenchmarkSection(result, '🧭 User Journey Benchmarks');

      expect(html).toContain('<h4>Onboarding Import Wallet</h4>');
      expect(html).toContain('<h4>Asset Details</h4>');
    });

    it('returns empty string when no entries and no missing presets', () => {
      const empty: FetchBenchmarkResult = { entries: [], missingPresets: [] };
      expect(buildBenchmarkSection(empty, '🧭 User Journey Benchmarks')).toBe(
        '',
      );
    });
  });

  describe('missing data warnings', () => {
    it('renders warning when presets are missing', () => {
      const result: FetchBenchmarkResult = {
        entries: [],
        missingPresets: ['chrome/browserify/interactionUserActions'],
      };
      const html = buildBenchmarkSection(result, '👆 Interaction Benchmarks');

      expect(html).toContain('⚠️');
      expect(html).toContain('Missing data');
      expect(html).toContain('chrome/browserify/interactionUserActions');
      expect(html).not.toContain('<table>');
    });

    it('renders both table and warning when some presets are missing', () => {
      const result: FetchBenchmarkResult = {
        entries: extractEntries(mockUserActionsJson),
        missingPresets: ['firefox/browserify/interactionUserActions'],
      };
      const html = buildBenchmarkSection(result, '👆 Interaction Benchmarks');

      expect(html).toContain('⚠️');
      expect(html).toContain('firefox/browserify/interactionUserActions');
      expect(html).toContain('<table>');
      expect(html).toContain('<h4>Load New Account</h4>');
    });
  });
});

describe('extractEntries with presetName', () => {
  it('propagates presetName to each extracted entry', () => {
    const entries = extractEntries(
      { loadNewAccount: mockUserActionsJson.loadNewAccount },
      'interactionUserActions',
    );

    expect(entries).toHaveLength(1);
    expect(entries[0].presetName).toBe('interactionUserActions');
  });

  it('defaults presetName to empty string when not provided', () => {
    const entries = extractEntries({
      loadNewAccount: mockUserActionsJson.loadNewAccount,
    });

    expect(entries[0].presetName).toBe('');
  });
});

describe('buildTableRows with baseline', () => {
  // buildTableRows now takes a single entry + already-resolved baselineMetrics
  const makeEntry = (
    overrides: Partial<BenchmarkEntry> = {},
  ): BenchmarkEntry => ({
    benchmarkName: 'loadNewAccount',
    presetName: 'interactionUserActions',
    mean: { loadNewAccount: 523 },
    min: { loadNewAccount: 480 },
    max: { loadNewAccount: 620 },
    stdDev: { loadNewAccount: 45 },
    p75: { loadNewAccount: 550 },
    p95: { loadNewAccount: 612 },
    ...overrides,
  });

  const makeBaseline = (
    mean: number,
    p75: number,
    p95: number,
  ): NonNullable<Parameters<typeof buildTableRows>[1]> => ({
    loadNewAccount: { mean, p75, p95 },
  });

  it('renders no indicator when baseline is absent', () => {
    const rows = buildTableRows(makeEntry());

    expect(rows[0]).toContain('523 ms');
    expect(rows[0]).not.toContain('🔺');
    expect(rows[0]).not.toContain('🟡');
    expect(rows[0]).not.toContain('🟢');
  });

  it('renders neutral indicator (➡️) when mean is within 5% of baseline', () => {
    // mean=523 vs baseline mean=540 → ~3.1% faster → neutral
    const rows = buildTableRows(makeEntry(), makeBaseline(540, 540, 600));

    expect(rows[0]).toContain('➡️');
    expect(rows[0]).toContain('523 ms');
  });

  it('renders warn indicator (🟡⬆️) when mean is 5–10% above baseline', () => {
    // mean=580 vs baseline mean=540 → ~7.4% slower → warn
    const rows = buildTableRows(
      makeEntry({ mean: { loadNewAccount: 580 } }),
      makeBaseline(540, 540, 600),
    );

    expect(rows[0]).toContain('🟡⬆️');
    expect(rows[0]).toContain('+7%');
    expect(rows[0]).toContain('580 ms');
  });

  it('renders warn indicator (🟡⬆️) when mean is >10% above baseline (regression downgraded)', () => {
    // mean=600 vs baseline mean=540 → ~11.1% slower → regression downgraded to warn in PR table
    const rows = buildTableRows(
      makeEntry({ mean: { loadNewAccount: 600 } }),
      makeBaseline(540, 540, 600),
    );

    expect(rows[0]).toContain('🟡⬆️');
    expect(rows[0]).not.toContain('🔺');
  });

  it('renders improvement indicator (🟢⬇️) when mean is >10% below baseline', () => {
    // mean=480 vs baseline mean=540 → ~11.1% faster → improvement
    const rows = buildTableRows(
      makeEntry({ mean: { loadNewAccount: 480 } }),
      makeBaseline(540, 540, 600),
    );

    expect(rows[0]).toContain('🟢⬇️');
    expect(rows[0]).toContain('-11%');
    expect(rows[0]).toContain('480 ms');
  });

  it('renders no indicator when baseline exists but metric key is absent', () => {
    const rows = buildTableRows(makeEntry(), {
      differentMetric: { mean: 540, p75: 540, p95: 600 },
    });

    expect(rows[0]).not.toContain('🟡');
    expect(rows[0]).not.toContain('🟢');
    expect(rows[0]).not.toContain('➡️');
  });

  it('result cell format is "indicator · value ms" when indicator exists', () => {
    // mean=580 vs baseline 540 → +7.4% → 🟡⬆️ +7%
    const rows = buildTableRows(
      makeEntry({ mean: { loadNewAccount: 580 } }),
      makeBaseline(540, 540, 600),
    );

    expect(rows[0]).toContain('🟡⬆️ +7% · 580 ms');
  });
});

describe('buildBenchmarkSection with baseline', () => {
  const makeResult = (entries: BenchmarkEntry[]): FetchBenchmarkResult => ({
    entries,
    missingPresets: [],
  });

  it('renders traffic-light indicators when baseline is provided', () => {
    // mean=523 vs baseline mean=540 → ~3.1% faster → neutral ➡️
    const entries = extractEntries(
      { loadNewAccount: mockUserActionsJson.loadNewAccount },
      'interactionUserActions',
    );
    const baseline = {
      'interactionUserActions/loadNewAccount': {
        loadNewAccount: { mean: 540, p75: 540, p95: 600 },
      },
    };

    const html = buildBenchmarkSection(
      makeResult(entries),
      '👆 Interaction Benchmarks',
      baseline,
    );

    expect(html).toContain('➡️');
  });

  it('renders warn indicator in Result cell when mean is 5–10% above baseline', () => {
    // mean=580 vs baseline mean=540 → 7.4% slower
    const entries: BenchmarkEntry[] = [
      {
        benchmarkName: 'loadNewAccount',
        presetName: 'interactionUserActions',
        mean: { loadNewAccount: 580 },
        min: { loadNewAccount: 480 },
        max: { loadNewAccount: 620 },
        stdDev: { loadNewAccount: 45 },
        p75: { loadNewAccount: 580 },
        p95: { loadNewAccount: 612 },
      },
    ];
    const baseline = {
      'interactionUserActions/loadNewAccount': {
        loadNewAccount: { mean: 540, p75: 540, p95: 600 },
      },
    };

    const html = buildBenchmarkSection(
      makeResult(entries),
      '👆 Interaction Benchmarks',
      baseline,
    );

    expect(html).toContain('🟡⬆️');
  });

  it('shows regressions summary when a metric mean is significantly worse', () => {
    const entries: BenchmarkEntry[] = [
      {
        benchmarkName: 'loadNewAccount',
        presetName: 'interactionUserActions',
        mean: { loadNewAccount: 580 },
        min: { loadNewAccount: 480 },
        max: { loadNewAccount: 620 },
        stdDev: { loadNewAccount: 45 },
        p75: { loadNewAccount: 580 },
        p95: { loadNewAccount: 612 },
      },
    ];
    const baseline = {
      'interactionUserActions/loadNewAccount': {
        loadNewAccount: { mean: 540, p75: 540, p95: 600 },
      },
    };

    const html = buildBenchmarkSection(
      makeResult(entries),
      '👆 Interaction Benchmarks',
      baseline,
    );

    expect(html).toContain('⚠️');
    expect(html).toContain('Regressions');
    expect(html).toContain('loadNewAccount');
  });

  it('shows improvements summary when a metric mean is significantly better', () => {
    const entries: BenchmarkEntry[] = [
      {
        benchmarkName: 'loadNewAccount',
        presetName: 'interactionUserActions',
        mean: { loadNewAccount: 400 },
        min: { loadNewAccount: 380 },
        max: { loadNewAccount: 420 },
        stdDev: { loadNewAccount: 15 },
        p75: { loadNewAccount: 410 },
        p95: { loadNewAccount: 420 },
      },
    ];
    const baseline = {
      'interactionUserActions/loadNewAccount': {
        loadNewAccount: { mean: 540, p75: 540, p95: 600 },
      },
    };

    const html = buildBenchmarkSection(
      makeResult(entries),
      '👆 Interaction Benchmarks',
      baseline,
    );

    expect(html).toContain('🚀');
    expect(html).toContain('Improvements');
    expect(html).toContain('loadNewAccount');
  });

  it('resolves startup baseline via preset-name scan (pageLoad/* key format)', () => {
    // Startup benchmarks are stored in historical data as "pageLoad/chrome-browserify-startupStandardHome"
    // but entries have presetName='startupStandardHome' and benchmarkName='standardHome'.
    const entries: BenchmarkEntry[] = [
      {
        benchmarkName: 'standardHome',
        presetName: 'startupStandardHome',
        mean: { uiStartup: 1400 },
        min: { uiStartup: 1200 },
        max: { uiStartup: 1700 },
        stdDev: { uiStartup: 100 },
        p75: { uiStartup: 1480 },
        p95: { uiStartup: 1620 },
      },
    ];
    // uiStartup mean=1400 vs baseline mean=1450 → ~3.4% faster → neutral ➡️
    const baseline = {
      'pageLoad/chrome-browserify-startupStandardHome': {
        uiStartup: { mean: 1450, p75: 1490, p95: 1650 },
      },
    };

    const html = buildBenchmarkSection(
      makeResult(entries),
      '🔌 Startup Benchmarks',
      baseline,
    );

    expect(html).toContain('➡️');
  });

  it('renders section without indicators when no baseline is given', () => {
    const entries = extractEntries(
      { loadNewAccount: mockUserActionsJson.loadNewAccount },
      'interactionUserActions',
    );

    const html = buildBenchmarkSection(
      makeResult(entries),
      '👆 Interaction Benchmarks',
    );

    expect(html).toContain('<h4>Load New Account</h4>');
    expect(html).not.toContain('🟡');
    expect(html).not.toContain('🟢');
    expect(html).not.toContain('➡️');
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

  it('returns entries when fetch succeeds', async () => {
    const payload: Record<string, BenchmarkResults> = {
      confirmTx: {
        testTitle: 'benchmark-confirm-tx',
        persona: 'standard',
        mean: { confirmTx: 1000 },
        min: { confirmTx: 900 },
        max: { confirmTx: 1100 },
        stdDev: { confirmTx: 50 },
        p75: { confirmTx: 1050 },
        p95: { confirmTx: 1090 },
      },
    };
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(payload),
    } as unknown as Response);

    const { entries, missingPresets } = await fetchBenchmarkEntries(HOST, [
      'interactionUserActions',
    ]);

    expect(entries.length).toBeGreaterThan(0);
    expect(entries[0].benchmarkName).toBe('confirmTx');
    expect(entries[0].presetName).toBe('interactionUserActions');
    expect(missingPresets).toHaveLength(0);
  });

  it('records missing presets when fetch returns non-ok', async () => {
    mockFetch.mockResolvedValue({ ok: false } as Response);

    const { entries, missingPresets } = await fetchBenchmarkEntries(HOST, [
      'interactionUserActions',
    ]);

    expect(entries).toHaveLength(0);
    expect(missingPresets.length).toBeGreaterThan(0);
    expect(missingPresets[0]).toContain('interactionUserActions');
  });

  it('records missing presets when fetch throws', async () => {
    mockFetch.mockRejectedValue(new Error('network error'));

    const { entries, missingPresets } = await fetchBenchmarkEntries(HOST, [
      'interactionUserActions',
    ]);

    expect(entries).toHaveLength(0);
    expect(missingPresets.length).toBeGreaterThan(0);
  });
});

describe('buildPerformanceBenchmarksSection', () => {
  const HOST = 'https://ci.example.com';
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

  const mockPayload: Record<string, BenchmarkResults> = {
    confirmTx: {
      testTitle: 'benchmark-confirm-tx',
      persona: 'standard',
      mean: { confirmTx: 1000 },
      min: { confirmTx: 900 },
      max: { confirmTx: 1100 },
      stdDev: { confirmTx: 50 },
      p75: { confirmTx: 1050 },
      p95: { confirmTx: 1090 },
    },
  };

  it('returns a collapsible section with all three subsections when data is available', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockPayload),
    } as unknown as Response);

    const result = await buildPerformanceBenchmarksSection(HOST);

    expect(result).toContain('<details>');
    expect(result).toContain('⚡ Performance Benchmarks');
  });

  it('returns a section with missing preset warnings when all fetches fail', async () => {
    mockFetch.mockResolvedValue({ ok: false } as Response);

    const result = await buildPerformanceBenchmarksSection(HOST);

    // When all fetches fail, missing-preset warnings are shown instead of empty string
    expect(result).toContain('⚡ Performance Benchmarks');
    expect(result).toContain('Missing data');
  });

  it('fetches historical baseline and passes it to section builders', async () => {
    const fetchHistoricalSpy = jest
      .spyOn(historicalComparison, 'fetchHistoricalPerformanceData')
      .mockResolvedValue({
        'interactionUserActions/confirmTx': {
          // mean=1000 baseline vs payload mean=1000 → 0% → neutral ➡️
          confirmTx: { mean: 800, p75: 900, p95: 980 },
        },
      });

    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockPayload),
    } as unknown as Response);

    const result = await buildPerformanceBenchmarksSection(HOST);

    expect(fetchHistoricalSpy).toHaveBeenCalledTimes(1);
    // confirmTx mean=1000 vs baseline mean=800 → +25% → warn 🟡⬆️
    expect(result).toContain('🟡⬆️');
  });

  it('renders section without indicators when historical baseline returns null', async () => {
    jest
      .spyOn(historicalComparison, 'fetchHistoricalPerformanceData')
      .mockResolvedValue(null);

    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockPayload),
    } as unknown as Response);

    const result = await buildPerformanceBenchmarksSection(HOST);

    expect(result).toContain('⚡ Performance Benchmarks');
    // No baseline → no traffic-light icons in the table
    expect(result).not.toContain('🟡');
    expect(result).not.toContain('🟢');
    expect(result).not.toContain('➡️');
  });
});
