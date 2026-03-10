import { promises as fs } from 'fs';
import type { BenchmarkResults } from '../../shared/constants/benchmarks';
import {
  resolveThresholdConfig,
  runComparison,
  loadCurrentBenchmarks,
  loadBaseline,
  printReport,
} from './compare-benchmarks';
import * as historicalComparison from './historical-comparison';

function makeBenchmarkResults(
  overrides: Partial<BenchmarkResults> = {},
): BenchmarkResults {
  return {
    testTitle: 'test',
    persona: 'standard',
    mean: { uiStartup: 1500 },
    min: { uiStartup: 1000 },
    max: { uiStartup: 2000 },
    stdDev: { uiStartup: 200 },
    p75: { uiStartup: 1800 },
    p95: { uiStartup: 2200 },
    ...overrides,
  };
}

describe('compare-benchmarks', () => {
  describe('resolveThresholdConfig', () => {
    it('resolves a direct kebab-case match', () => {
      const config = resolveThresholdConfig('onboarding-import-wallet');
      expect(config).toBeDefined();
      expect(config).toHaveProperty('importWalletToSocialScreen');
    });

    it('strips benchmark prefix before matching', () => {
      const config = resolveThresholdConfig('benchmark-chrome-browserify-swap');
      expect(config).toBeDefined();
      expect(config).toHaveProperty('openSwapPageFromHome');
    });

    it('returns undefined for unknown benchmarks', () => {
      expect(resolveThresholdConfig('non-existent-benchmark')).toBeUndefined();
    });
  });

  describe('runComparison', () => {
    beforeEach(() => {
      jest.spyOn(console, 'warn').mockImplementation();
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('passes when results are within thresholds', () => {
      const benchmarks = [
        {
          name: 'onboarding-import-wallet',
          data: {
            'onboarding-import-wallet': makeBenchmarkResults({
              p75: { importWalletToSocialScreen: 1500 },
              p95: { importWalletToSocialScreen: 2000 },
              mean: { importWalletToSocialScreen: 1200 },
            }),
          },
        },
      ];

      const result = runComparison(benchmarks, {});
      expect(result.anyFailed).toBe(false);
      expect(result.comparisons.length).toBeGreaterThan(0);
    });

    it('fails when p75 exceeds fail threshold', () => {
      const benchmarks = [
        {
          name: 'onboarding-import-wallet',
          data: {
            'onboarding-import-wallet': makeBenchmarkResults({
              p75: { importWalletToSocialScreen: 99999 },
              p95: { importWalletToSocialScreen: 99999 },
              mean: { importWalletToSocialScreen: 99999 },
            }),
          },
        },
      ];

      const result = runComparison(benchmarks, {});
      expect(result.anyFailed).toBe(true);
    });

    it('includes relative metrics when baseline is available', () => {
      const benchmarks = [
        {
          name: 'onboarding-import-wallet',
          data: {
            'onboarding-import-wallet': makeBenchmarkResults({
              p75: { importWalletToSocialScreen: 1500 },
              p95: { importWalletToSocialScreen: 2000 },
              mean: { importWalletToSocialScreen: 1200 },
            }),
          },
        },
      ];

      const baseline = {
        'onboarding-import-wallet': {
          importWalletToSocialScreen: { mean: 1100, p75: 1400, p95: 1900 },
        },
      };

      const result = runComparison(benchmarks, baseline);
      const comparison = result.comparisons[0];
      expect(comparison.relativeMetrics.length).toBeGreaterThan(0);
      expect(comparison.relativeMetrics[0].percentile).toBe('p75');
      expect(comparison.relativeMetrics[0].baseline).toBe(1400);
    });

    it('resolves page-load baseline by stripping benchmark- prefix from filename', () => {
      const benchmarks = [
        {
          name: 'benchmark-chrome-browserify-startupStandardHome',
          data: {
            standardHome: makeBenchmarkResults({
              p75: { uiStartup: 1800 },
              p95: { uiStartup: 2200 },
              mean: { uiStartup: 1500 },
            }),
          },
        },
      ];

      const baseline = {
        'pageLoad/chrome-browserify-startupStandardHome': {
          uiStartup: { mean: 1400, p75: 1700, p95: 2100 },
        },
      };

      const result = runComparison(benchmarks, baseline);
      const comparison = result.comparisons[0];
      expect(comparison.relativeMetrics.length).toBeGreaterThan(0);
      expect(comparison.relativeMetrics[0].baseline).toBe(1700);
    });

    it('skips entries with no matching threshold config', () => {
      const benchmarks = [
        {
          name: 'unknown-benchmark',
          data: {
            'unknown-benchmark': makeBenchmarkResults(),
          },
        },
      ];

      const result = runComparison(benchmarks, {});
      expect(result.comparisons).toHaveLength(0);
    });
  });

  describe('resolveThresholdConfig (additional)', () => {
    it('resolves camelCase entry name via kebab conversion', () => {
      const config = resolveThresholdConfig('onboardingImportWallet');
      expect(config).toBeDefined();
      expect(config).toHaveProperty('importWalletToSocialScreen');
    });

    it('strips firefox-browserify prefix', () => {
      const config = resolveThresholdConfig(
        'benchmark-firefox-browserify-swap',
      );
      expect(config).toBeDefined();
      expect(config).toHaveProperty('openSwapPageFromHome');
    });

    it('strips chrome-webpack prefix', () => {
      const config = resolveThresholdConfig('benchmark-chrome-webpack-swap');
      expect(config).toBeDefined();
      expect(config).toHaveProperty('openSwapPageFromHome');
    });

    it('strips prefix then converts to kebab-case', () => {
      const config = resolveThresholdConfig(
        'benchmark-chrome-browserify-onboardingImportWallet',
      );
      expect(config).toBeDefined();
      expect(config).toHaveProperty('importWalletToSocialScreen');
    });
  });

  describe('loadCurrentBenchmarks', () => {
    it('loads JSON files from a directory', async () => {
      jest
        .spyOn(fs, 'readdir')
        .mockResolvedValue(['bench-a.json', 'bench-b.json', 'readme.txt'] as never);
      jest.spyOn(fs, 'readFile').mockResolvedValue(
        JSON.stringify({ entry: makeBenchmarkResults() }),
      );

      const results = await loadCurrentBenchmarks('/fake/dir');

      expect(results).toHaveLength(2);
      expect(results[0].name).toBe('bench-a');
      expect(results[1].name).toBe('bench-b');

      jest.restoreAllMocks();
    });
  });

  describe('loadBaseline', () => {
    it('returns empty object when fetch returns null', async () => {
      jest
        .spyOn(historicalComparison, 'fetchHistoricalPerformanceData')
        .mockResolvedValue(null);

      const result = await loadBaseline();

      expect(result).toStrictEqual({});

      jest.restoreAllMocks();
    });

    it('returns baseline data when fetch succeeds', async () => {
      const mockBaseline = {
        'test/metric': { uiStartup: { mean: 100, p75: 110, p95: 130 } },
      };
      jest
        .spyOn(historicalComparison, 'fetchHistoricalPerformanceData')
        .mockResolvedValue(mockBaseline);

      const result = await loadBaseline();

      expect(result).toBe(mockBaseline);

      jest.restoreAllMocks();
    });
  });

  describe('printReport', () => {
    let logSpy: jest.SpyInstance;

    beforeEach(() => {
      logSpy = jest.spyOn(console, 'log').mockImplementation();
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('prints PASS when no benchmarks failed', () => {
      printReport({ comparisons: [], anyFailed: false });

      const output = logSpy.mock.calls.map((c: unknown[]) => c[0]).join('\n');
      expect(output).toContain('RESULT: PASS');
    });

    it('prints FAIL when a benchmark failed', () => {
      printReport({
        comparisons: [
          {
            benchmarkName: 'test-bench',
            relativeMetrics: [],
            absoluteViolations: [],
            hasRegression: false,
            hasWarning: false,
            absoluteFailed: true,
          },
        ],
        anyFailed: true,
      });

      const output = logSpy.mock.calls.map((c: unknown[]) => c[0]).join('\n');
      expect(output).toContain('FAIL  test-bench');
      expect(output).toContain('RESULT: FAIL');
    });

    it('shows (no historical baseline data) when no relative metrics', () => {
      printReport({
        comparisons: [
          {
            benchmarkName: 'test-bench',
            relativeMetrics: [],
            absoluteViolations: [],
            hasRegression: false,
            hasWarning: false,
            absoluteFailed: false,
          },
        ],
        anyFailed: false,
      });

      const output = logSpy.mock.calls.map((c: unknown[]) => c[0]).join('\n');
      expect(output).toContain('(no historical baseline data)');
    });

    it('groups p75 and p95 on same line with indications', () => {
      printReport({
        comparisons: [
          {
            benchmarkName: 'test-bench',
            relativeMetrics: [
              {
                metric: 'uiStartup',
                percentile: 'p75',
                current: 1100,
                baseline: 1000,
                delta: 100,
                deltaPercent: 0.1,
                direction: 'slower',
                severity: 'regression',
                indication: '🔺',
              },
              {
                metric: 'uiStartup',
                percentile: 'p95',
                current: 1300,
                baseline: 1200,
                delta: 100,
                deltaPercent: 0.083,
                direction: 'slower',
                severity: 'warn',
                indication: '🟡⬆️',
              },
            ],
            absoluteViolations: [],
            hasRegression: true,
            hasWarning: true,
            absoluteFailed: false,
          },
        ],
        anyFailed: false,
      });

      const output = logSpy.mock.calls.map((c: unknown[]) => c[0]).join('\n');
      expect(output).toContain('uiStartup:');
      expect(output).toContain('p75: 1100ms');
      expect(output).toContain('p95: 1300ms');
    });

    it('overrides indication with 🔺 for absolute fail violations', () => {
      printReport({
        comparisons: [
          {
            benchmarkName: 'test-bench',
            relativeMetrics: [
              {
                metric: 'uiStartup',
                percentile: 'p75',
                current: 99999,
                baseline: 1000,
                delta: 98999,
                deltaPercent: 98.999,
                direction: 'slower',
                severity: 'regression',
                indication: '🔺',
              },
              {
                metric: 'uiStartup',
                percentile: 'p95',
                current: 99999,
                baseline: 1200,
                delta: 98799,
                deltaPercent: 82.33,
                direction: 'slower',
                severity: 'regression',
                indication: '🔺',
              },
            ],
            absoluteViolations: [
              {
                metricId: 'uiStartup',
                percentile: 'p75',
                value: 99999,
                threshold: 5000,
                severity: 'fail',
              },
            ],
            hasRegression: true,
            hasWarning: false,
            absoluteFailed: true,
          },
        ],
        anyFailed: true,
      });

      const output = logSpy.mock.calls.map((c: unknown[]) => c[0]).join('\n');
      expect(output).toContain('🔺 p75: 99999ms');
    });

    it('counts warnings for benchmarks with warn-level violations', () => {
      printReport({
        comparisons: [
          {
            benchmarkName: 'warn-bench',
            relativeMetrics: [],
            absoluteViolations: [
              {
                metricId: 'uiStartup',
                percentile: 'p75',
                value: 5000,
                threshold: 4500,
                severity: 'warn',
              },
            ],
            hasRegression: false,
            hasWarning: true,
            absoluteFailed: false,
          },
        ],
        anyFailed: false,
      });

      const output = logSpy.mock.calls.map((c: unknown[]) => c[0]).join('\n');
      expect(output).toContain('1 warnings');
    });
  });
});
