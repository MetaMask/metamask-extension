// Timer IDs from benchmark flows use snake_case (e.g. load_new_account, confirm_tx)
/* eslint-disable @typescript-eslint/naming-convention */

import type { BenchmarkResults } from '../../test/e2e/benchmarks/utils/types';
import { buildTableRows, buildBenchmarkSection, extractEntries } from './utils';

const mockUserActionsJson: Record<string, BenchmarkResults> = {
  loadNewAccount: {
    testTitle: 'benchmark-user-actions-load-new-account',
    persona: 'standard',
    mean: { load_new_account: 523.4 },
    min: { load_new_account: 480 },
    max: { load_new_account: 620 },
    stdDev: { load_new_account: 45.2 },
    p75: { load_new_account: 550 },
    p95: { load_new_account: 612 },
  },
  confirmTx: {
    testTitle: 'benchmark-user-actions-confirm-tx',
    persona: 'standard',
    mean: { confirm_tx: 3456.7 },
    min: { confirm_tx: 3100 },
    max: { confirm_tx: 3900 },
    stdDev: { confirm_tx: 210.3 },
    p75: { confirm_tx: 3600 },
    p95: { confirm_tx: 3812 },
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
  it('filters out entries without a mean object', () => {
    const data = {
      valid: { mean: { metric: 100 } },
      invalid: { testTitle: 'no-mean' },
    };

    const entries = extractEntries(data);
    expect(entries).toHaveLength(1);
    expect(entries[0].benchmarkName).toBe('valid');
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
    expect(row).toContain('load_new_account');
    expect(row).toContain('>523<');
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
    expect(row).toContain('confirm_tx');
    expect(row).toContain('>3457<');
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
    expect(rows[0]).toContain('>19<');
    expect(rows[0]).toContain('>215<');
    expect(rows[0]).toContain('>245<');

    expect(rows[1]).not.toContain('Bridge User Actions');
    expect(rows[1]).toContain('bridgeTokenSwitch');
    expect(rows[1]).toContain('>151<');
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
    expect(rows[0]).toContain('>32<');
    expect(rows[0]).toContain('>230<');
    expect(rows[0]).toContain('>280<');

    expect(rows[1]).toContain('srpButtonToSrpForm');
    expect(rows[1]).toContain('>53<');
    expect(rows[1]).toContain('>8<');
    expect(rows[1]).toContain('>58<');
    expect(rows[1]).toContain('>70<');

    expect(rows[2]).toContain('confirmSrpToPasswordForm');
    expect(rows[2]).toContain('>150<');
    expect(rows[2]).toContain('>20<');
    expect(rows[2]).toContain('>165<');
    expect(rows[2]).toContain('>195<');

    expect(rows[3]).toContain('doneButtonToHomeScreen');
    expect(rows[3]).toContain('>8500<');
    expect(rows[3]).toContain('>600<');
    expect(rows[3]).toContain('>9000<');
    expect(rows[3]).toContain('>10200<');
  });

  it('renders dash for missing statistical fields', () => {
    const rows = buildTableRows([
      {
        benchmarkName: 'noStats',
        entry: { mean: { myMetric: 100 } },
      },
    ]);

    expect(rows).toHaveLength(1);
    expect(rows[0]).toContain('>100<');
    const dashes = rows[0].match(/>-</gu);
    expect(dashes).toHaveLength(3);
  });
});

describe('buildBenchmarkSection', () => {
  describe('interaction benchmarks', () => {
    const entries = extractEntries(mockUserActionsJson);

    it('wraps rows in a collapsible details section', () => {
      const html = buildBenchmarkSection(
        entries,
        '👆 Interaction Benchmarks',
        'Action',
      );

      expect(html).toContain('<details>');
      expect(html).toContain('👆 Interaction Benchmarks');
      expect(html).toContain('<table>');
      expect(html).toContain('</details>');
    });

    it('includes correct column headers', () => {
      const html = buildBenchmarkSection(
        entries,
        '👆 Interaction Benchmarks',
        'Action',
      );

      expect(html).toContain('<th>Action</th>');
      expect(html).toContain('<th>Metric</th>');
      expect(html).toContain('<th>Mean (ms)</th>');
      expect(html).toContain('<th>Std Dev (ms)</th>');
      expect(html).toContain('<th>P75 (ms)</th>');
      expect(html).toContain('<th>P95 (ms)</th>');
    });

    it('returns empty string when no data', () => {
      expect(
        buildBenchmarkSection([], '👆 Interaction Benchmarks', 'Action'),
      ).toBe('');
    });
  });

  describe('user journey benchmarks', () => {
    const entries = [
      ...extractEntries(mockPerformanceOnboardingJson),
      ...extractEntries(mockPerformanceAssetsJson),
    ];

    it('wraps rows in a collapsible details section', () => {
      const html = buildBenchmarkSection(
        entries,
        '🧭 User Journey Benchmarks',
        'Benchmark',
      );

      expect(html).toContain('<details>');
      expect(html).toContain('🧭 User Journey Benchmarks');
      expect(html).toContain('<table>');
      expect(html).toContain('</details>');
    });

    it('includes correct column headers', () => {
      const html = buildBenchmarkSection(
        entries,
        '🧭 User Journey Benchmarks',
        'Benchmark',
      );

      expect(html).toContain('<th>Benchmark</th>');
      expect(html).toContain('<th>Metric</th>');
      expect(html).toContain('<th>Mean (ms)</th>');
    });

    it('includes entries from all presets', () => {
      const html = buildBenchmarkSection(
        entries,
        '🧭 User Journey Benchmarks',
        'Benchmark',
      );

      expect(html).toContain('Onboarding Import Wallet');
      expect(html).toContain('Asset Details');
    });

    it('returns empty string when no data', () => {
      expect(
        buildBenchmarkSection([], '🧭 User Journey Benchmarks', 'Benchmark'),
      ).toBe('');
    });
  });
});
