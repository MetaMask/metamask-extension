import type { BenchmarkResults } from '../../shared/constants/benchmarks';
import { resolveThresholdConfig, runComparison } from './compare-benchmarks';

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
});
