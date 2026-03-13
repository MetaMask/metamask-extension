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

  it('renders loadNewAccount row in 7-column format (Metric | Mean | Min | Max | Std Dev | P75 | P95)', () => {
    const [entry] = extractEntries({
      loadNewAccount: mockUserActionsJson.loadNewAccount,
    });
    const [row] = buildTableRows(entry);

    // Metric cell: key only (no benchmark name in row)
    expect(row).toContain('loadNewAccount');
    expect(row).not.toContain('Load New Account');
    // No separate Result column
    expect(row).not.toContain('>Result<');
    // Mean, Std Dev, P75, P95 all show 'value ms' (no indicator when no baseline)
    expect(row).toContain('523 ms');
    expect(row).toContain('45 ms');
    expect(row).toContain('550 ms');
    expect(row).toContain('612 ms');
    // Min and Max are raw numbers
    expect(row).toContain('>480<');
    expect(row).toContain('>620<');
  });

  it('renders confirmTx row with correct rounded values', () => {
    const [entry] = extractEntries({
      confirmTx: mockUserActionsJson.confirmTx,
    });
    const [row] = buildTableRows(entry);

    expect(row).toContain('confirmTx');
    expect(row).not.toContain('Confirm Tx');
    // Mean, Std Dev, P75, P95 show 'value ms'
    expect(row).toContain('3457 ms');
    expect(row).toContain('210 ms');
    expect(row).toContain('3600 ms');
    expect(row).toContain('3812 ms');
    // Min and Max are raw numbers
    expect(row).toContain('>3100<');
    expect(row).toContain('>3900<');
  });

  it('renders multi-metric entry with one row per metric', () => {
    const [entry] = extractEntries({
      bridgeUserActions: mockUserActionsJson.bridgeUserActions,
    });
    const rows = buildTableRows(entry);

    expect(rows).toHaveLength(2);
    expect(rows[0]).toContain('bridgePageLoad');
    // Mean, P75, P95 show 'value ms'
    expect(rows[0]).toContain('200 ms');
    expect(rows[0]).toContain('215 ms');
    expect(rows[0]).toContain('245 ms');
    expect(rows[0]).toContain('>180<');
    expect(rows[0]).toContain('>260<');

    expect(rows[1]).toContain('bridgeTokenSwitch');
    // Mean, P75, P95 show 'value ms'
    expect(rows[1]).toContain('151 ms');
    expect(rows[1]).toContain('160 ms');
    expect(rows[1]).toContain('178 ms');
    expect(rows[1]).toContain('>130<');
    expect(rows[1]).toContain('>190<');
  });

  it('renders onboarding metrics with correct step values', () => {
    const [entry] = extractEntries(mockPerformanceOnboardingJson);
    const rows = buildTableRows(entry);

    expect(rows).toHaveLength(4);
    expect(rows[0]).not.toContain('rowspan');
    expect(rows[0]).toContain('importWalletToSocialScreen');
    // Mean, P75, P95 show 'value ms'
    expect(rows[0]).toContain('209 ms');
    expect(rows[0]).toContain('230 ms');
    expect(rows[0]).toContain('280 ms');
    expect(rows[0]).toContain('>170<');
    expect(rows[0]).toContain('>310<');
    expect(rows[0]).toContain('32 ms');

    expect(rows[1]).toContain('srpButtonToSrpForm');
    // Mean, P75, P95 show 'value ms'
    expect(rows[1]).toContain('53 ms');
    expect(rows[1]).toContain('58 ms');
    expect(rows[1]).toContain('70 ms');
    expect(rows[1]).toContain('>40<');
    expect(rows[1]).toContain('>80<');
  });

  it('orders total metric last and bolds it', () => {
    const entry: BenchmarkEntry = {
      benchmarkName: 'loadNewAccount',
      presetName: '',
      mean: { total: 275, loadNewAccount: 275 },
      min: { total: 271, loadNewAccount: 271 },
      max: { total: 279, loadNewAccount: 279 },
      stdDev: { total: 3, loadNewAccount: 3 },
      p75: { total: 276, loadNewAccount: 276 },
      p95: { total: 279, loadNewAccount: 279 },
    };
    const rows = buildTableRows(entry);

    // total row should be last
    expect(rows).toHaveLength(2);
    expect(rows[rows.length - 1]).toContain('<b>total</b>');
    expect(rows[0]).not.toContain('<b>total</b>');
  });

  it('renders dash in P75/P95 cells when those stats are missing; Mean still shows', () => {
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
    // Mean cell shows value
    expect(rows[0]).toContain('100 ms');
    // P75 and P95 cells show '-'
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

    it('uses 7-column headers: Metric | Mean | Min | Max | Std Dev | P75 | P95 (ms)', () => {
      const html = buildBenchmarkSection(result, '👆 Interaction Benchmarks');

      expect(html).toContain('>Metric<');
      expect(html).toContain('>Mean (ms)<');
      expect(html).toContain('>Min (ms)<');
      expect(html).toContain('>Max (ms)<');
      expect(html).toContain('>Std Dev (ms)<');
      expect(html).toContain('>P75 (ms)<');
      expect(html).toContain('>P95 (ms)<');
      // No combined Result column or old Benchmark / Metric column
      expect(html).not.toContain('>Result<');
      expect(html).not.toContain('>Benchmark / Metric<');
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
    stdDev: number,
    p75: number,
    p95: number,
  ): NonNullable<Parameters<typeof buildTableRows>[1]> => ({
    loadNewAccount: { mean, stdDev, p75, p95 },
  });

  it('renders no indicator when baseline is absent', () => {
    const rows = buildTableRows(makeEntry());

    // Mean, P75, P95 show plain 'value ms' with no indicator
    expect(rows[0]).toContain('523 ms');
    expect(rows[0]).toContain('550 ms');
    expect(rows[0]).toContain('612 ms');
    expect(rows[0]).not.toContain('🔺');
    expect(rows[0]).not.toContain('🟡');
    expect(rows[0]).not.toContain('🟢');
  });

  it('renders neutral indicator (➡️) on each percentile cell when all are within 5% of baseline', () => {
    // mean=523 vs baseline_mean=540 → -3.1% → neutral
    // stdDev=45 vs baseline_stdDev=45 → 0% → neutral
    // p75=550 vs baseline_p75=540  → +1.9% → neutral
    // p95=612 vs baseline_p95=600  → +2%   → neutral
    const rows = buildTableRows(makeEntry(), makeBaseline(540, 45, 540, 600));

    expect(rows[0]).toContain('➡️ · 523 ms');
    expect(rows[0]).toContain('➡️ · 45 ms');
    expect(rows[0]).toContain('➡️ · 550 ms');
    expect(rows[0]).toContain('➡️ · 612 ms');
  });

  it('renders warn indicator (🟡⬆️) on P95 cell when p95 is 5–10% above baseline p95', () => {
    // p95=636 vs baseline_p95=600 → +6% → warn on P95
    // mean=523 vs baseline_mean=540 → -3.1% → neutral on Mean
    const rows = buildTableRows(
      makeEntry({ p95: { loadNewAccount: 636 } }),
      makeBaseline(540, 45, 540, 600),
    );

    expect(rows[0]).toContain('🟡⬆️ +6% · 636 ms');
    expect(rows[0]).toContain('➡️ · 523 ms');
  });

  it('renders warn indicator (🟡⬆️) when p95 is >10% above baseline p95 (regression downgraded)', () => {
    // p95=660 vs baseline_p95=600 → +10% → regression downgraded to warn in PR table
    const rows = buildTableRows(
      makeEntry({ p95: { loadNewAccount: 660 } }),
      makeBaseline(540, 45, 540, 600),
    );

    expect(rows[0]).toContain('🟡⬆️');
    expect(rows[0]).not.toContain('🔺');
  });

  it('renders improvement indicator (🟢⬇️) on P95 cell when p95 is >10% below baseline p95', () => {
    // p95=540 vs baseline_p95=600 → -10% → improvement
    const rows = buildTableRows(
      makeEntry({ p95: { loadNewAccount: 540 } }),
      makeBaseline(540, 45, 540, 600),
    );

    expect(rows[0]).toContain('🟢⬇️ -10% · 540 ms');
  });

  it('renders no indicator when baseline exists but metric key is absent', () => {
    const rows = buildTableRows(makeEntry(), {
      differentMetric: { mean: 540, stdDev: 45, p75: 540, p95: 600 },
    });

    expect(rows[0]).not.toContain('🟡');
    expect(rows[0]).not.toContain('🟢');
    expect(rows[0]).not.toContain('➡️');
  });

  it('p95 cell format is "indicator · value ms" when indicator exists', () => {
    // p95=636 vs baseline_p95=600 → +6% → 🟡⬆️ +6%
    const rows = buildTableRows(
      makeEntry({ p95: { loadNewAccount: 636 } }),
      makeBaseline(540, 45, 540, 600),
    );

    expect(rows[0]).toContain('🟡⬆️ +6% · 636 ms');
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

  it('renders warn indicator in Result cell when p95 is 5–10% above baseline p95', () => {
    // p95=636 vs baseline p95=600 → +6% → warn
    const entries: BenchmarkEntry[] = [
      {
        benchmarkName: 'loadNewAccount',
        presetName: 'interactionUserActions',
        mean: { loadNewAccount: 580 },
        min: { loadNewAccount: 480 },
        max: { loadNewAccount: 620 },
        stdDev: { loadNewAccount: 45 },
        p75: { loadNewAccount: 580 },
        p95: { loadNewAccount: 636 },
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

  it('shows regressions summary when a metric p95 is significantly worse', () => {
    // p95=636 vs baseline p95=600 → +6% → warn → ⚠️ Regressions
    const entries: BenchmarkEntry[] = [
      {
        benchmarkName: 'loadNewAccount',
        presetName: 'interactionUserActions',
        mean: { loadNewAccount: 580 },
        min: { loadNewAccount: 480 },
        max: { loadNewAccount: 620 },
        stdDev: { loadNewAccount: 45 },
        p75: { loadNewAccount: 580 },
        p95: { loadNewAccount: 636 },
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
