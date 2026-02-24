import type { BenchmarkResults } from '../../test/e2e/benchmarks/utils/types';
import {
  buildTableRows,
  buildBenchmarkSection,
  extractEntries,
  fetchBenchmarkEntries,
  buildPerformanceBenchmarksSection,
  type FetchBenchmarkResult,
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
  it('produces one row per metric with correct cell values', () => {
    const entries = extractEntries(mockUserActionsJson);
    const rows = buildTableRows(entries);

    expect(rows).toHaveLength(4);
  });

  it('renders loadNewAccount row with correct rounded values', () => {
    const entries = extractEntries({
      loadNewAccount: mockUserActionsJson.loadNewAccount,
    });
    const [row] = buildTableRows(entries);

    expect(row).toContain('Load New Account');
    expect(row).toContain('loadNewAccount');
    expect(row).toContain('>523<');
    expect(row).toContain('>480<');
    expect(row).toContain('>620<');
    expect(row).toContain('>45<');
    expect(row).toContain('>550<');
    expect(row).toContain('>612<');
  });

  it('renders confirmTx row with correct rounded values', () => {
    const entries = extractEntries({
      confirmTx: mockUserActionsJson.confirmTx,
    });
    const [row] = buildTableRows(entries);

    expect(row).toContain('Confirm Tx');
    expect(row).toContain('confirmTx');
    expect(row).toContain('>3457<');
    expect(row).toContain('>3100<');
    expect(row).toContain('>3900<');
    expect(row).toContain('>210<');
    expect(row).toContain('>3600<');
    expect(row).toContain('>3812<');
  });

  it('renders multi-metric entry with rowspan on first row only', () => {
    const entries = extractEntries({
      bridgeUserActions: mockUserActionsJson.bridgeUserActions,
    });
    const rows = buildTableRows(entries);

    expect(rows).toHaveLength(2);

    expect(rows[0]).toContain('rowspan="2"');
    expect(rows[0]).toContain('Bridge User Actions');
    expect(rows[0]).toContain('bridgePageLoad');
    expect(rows[0]).toContain('>200<');
    expect(rows[0]).toContain('>180<');
    expect(rows[0]).toContain('>260<');
    expect(rows[0]).toContain('>19<');
    expect(rows[0]).toContain('>215<');
    expect(rows[0]).toContain('>245<');

    expect(rows[1]).not.toContain('Bridge User Actions');
    expect(rows[1]).toContain('bridgeTokenSwitch');
    expect(rows[1]).toContain('>151<');
    expect(rows[1]).toContain('>130<');
    expect(rows[1]).toContain('>190<');
    expect(rows[1]).toContain('>12<');
    expect(rows[1]).toContain('>160<');
    expect(rows[1]).toContain('>178<');
  });

  it('renders performance metrics with correct values per row', () => {
    const entries = extractEntries(mockPerformanceOnboardingJson);
    const rows = buildTableRows(entries);

    expect(rows).toHaveLength(4);

    expect(rows[0]).toContain('rowspan="4"');
    expect(rows[0]).toContain('Onboarding Import Wallet');
    expect(rows[0]).toContain('importWalletToSocialScreen');
    expect(rows[0]).toContain('>209<');
    expect(rows[0]).toContain('>170<');
    expect(rows[0]).toContain('>310<');
    expect(rows[0]).toContain('>32<');
    expect(rows[0]).toContain('>230<');
    expect(rows[0]).toContain('>280<');

    expect(rows[1]).toContain('srpButtonToSrpForm');
    expect(rows[1]).toContain('>53<');
    expect(rows[1]).toContain('>40<');
    expect(rows[1]).toContain('>80<');
    expect(rows[1]).toContain('>8<');
    expect(rows[1]).toContain('>58<');
    expect(rows[1]).toContain('>70<');

    expect(rows[2]).toContain('confirmSrpToPasswordForm');
    expect(rows[2]).toContain('>150<');
    expect(rows[2]).toContain('>120<');
    expect(rows[2]).toContain('>210<');
    expect(rows[2]).toContain('>20<');
    expect(rows[2]).toContain('>165<');
    expect(rows[2]).toContain('>195<');

    expect(rows[3]).toContain('doneButtonToHomeScreen');
    expect(rows[3]).toContain('>8500<');
    expect(rows[3]).toContain('>7500<');
    expect(rows[3]).toContain('>11000<');
    expect(rows[3]).toContain('>600<');
    expect(rows[3]).toContain('>9000<');
    expect(rows[3]).toContain('>10200<');
  });

  it('renders dash when a metric key is missing from a stats field', () => {
    const rows = buildTableRows([
      {
        benchmarkName: 'partialStats',
        mean: { myMetric: 100 },
        min: {},
        max: {},
        stdDev: {},
        p75: {},
        p95: {},
      },
    ]);

    expect(rows).toHaveLength(1);
    expect(rows[0]).toContain('>100<');
    const dashes = rows[0].match(/>-</gu);
    expect(dashes).toHaveLength(5);
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

    it('wraps rows in a collapsible details section', () => {
      const html = buildBenchmarkSection(result, '👆 Interaction Benchmarks');

      expect(html).toContain('<details>');
      expect(html).toContain('👆 Interaction Benchmarks');
      expect(html).toContain('<table>');
      expect(html).toContain('</details>');
    });

    it('includes correct column headers', () => {
      const html = buildBenchmarkSection(result, '👆 Interaction Benchmarks');

      expect(html).toContain('<th>Benchmark</th>');
      expect(html).toContain('<th>Metric</th>');
      expect(html).toContain('<th>Mean (ms)</th>');
      expect(html).toContain('<th>Min (ms)</th>');
      expect(html).toContain('<th>Max (ms)</th>');
      expect(html).toContain('<th>Std Dev (ms)</th>');
      expect(html).toContain('<th>P75 (ms)</th>');
      expect(html).toContain('<th>P95 (ms)</th>');
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

    it('wraps rows in a collapsible details section', () => {
      const html = buildBenchmarkSection(result, '🧭 User Journey Benchmarks');

      expect(html).toContain('<details>');
      expect(html).toContain('🧭 User Journey Benchmarks');
      expect(html).toContain('<table>');
      expect(html).toContain('</details>');
    });

    it('includes correct column headers', () => {
      const html = buildBenchmarkSection(result, '🧭 User Journey Benchmarks');

      expect(html).toContain('<th>Benchmark</th>');
      expect(html).toContain('<th>Metric</th>');
      expect(html).toContain('<th>Mean (ms)</th>');
      expect(html).toContain('<th>Min (ms)</th>');
      expect(html).toContain('<th>Max (ms)</th>');
    });

    it('includes entries from all presets', () => {
      const html = buildBenchmarkSection(result, '🧭 User Journey Benchmarks');

      expect(html).toContain('Onboarding Import Wallet');
      expect(html).toContain('Asset Details');
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
      expect(html).toContain('Load New Account');
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
});
