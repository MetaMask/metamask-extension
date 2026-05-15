import type {
  BenchmarkResults,
  ThresholdConfig,
  ThresholdViolation,
} from '../../shared/constants/benchmarks';
import {
  BENCHMARK_PERSONA,
  DEFAULT_RELATIVE_THRESHOLDS,
  THRESHOLD_SEVERITY,
} from '../../shared/constants/benchmarks';
import { THRESHOLD_REGISTRY } from '../../test/e2e/benchmarks/utils/thresholds';

import {
  applyGatingPolicy,
  compareMetric,
  compareBenchmarkEntries,
  formatDeltaPercent,
  scaleThresholdsForBrowser,
  COMPARISON_SEVERITY,
  type BenchmarkEntryComparison,
} from './comparison-utils';

describe('benchmark-comparison', () => {
  describe('compareMetric', () => {
    it('classifies a >10% regression', () => {
      const result = compareMetric(
        'uiStartup',
        'p75',
        1100,
        1000,
        DEFAULT_RELATIVE_THRESHOLDS,
      );
      expect(result.severity).toBe(COMPARISON_SEVERITY.Regression.value);
      expect(result.indication).toBe(COMPARISON_SEVERITY.Regression.icon);
      expect(result.deltaPercent).toBeCloseTo(0.1);
      expect(result.percentile).toBe('p75');
    });

    it('classifies a >10% improvement as pass', () => {
      const result = compareMetric(
        'uiStartup',
        'p75',
        900,
        1000,
        DEFAULT_RELATIVE_THRESHOLDS,
      );
      expect(result.severity).toBe(COMPARISON_SEVERITY.Pass.value);
      expect(result.indication).toBe(COMPARISON_SEVERITY.Pass.icon);
    });

    it('classifies 5-10% as warn', () => {
      const result = compareMetric(
        'uiStartup',
        'p95',
        1060,
        1000,
        DEFAULT_RELATIVE_THRESHOLDS,
      );
      expect(result.severity).toBe(COMPARISON_SEVERITY.Warn.value);
      expect(result.indication).toBe(COMPARISON_SEVERITY.Warn.icon);
      expect(result.percentile).toBe('p95');
    });

    it('classifies <5% change as pass', () => {
      const result = compareMetric(
        'uiStartup',
        'p75',
        1020,
        1000,
        DEFAULT_RELATIVE_THRESHOLDS,
      );
      expect(result.severity).toBe(COMPARISON_SEVERITY.Pass.value);
      expect(result.indication).toBe(COMPARISON_SEVERITY.Pass.icon);
    });

    it('classifies a 5-10% improvement as pass', () => {
      const result = compareMetric(
        'uiStartup',
        'p75',
        940,
        1000,
        DEFAULT_RELATIVE_THRESHOLDS,
      );
      expect(result.severity).toBe(COMPARISON_SEVERITY.Pass.value);
      expect(result.indication).toBe(COMPARISON_SEVERITY.Pass.icon);
    });

    it('handles identical values', () => {
      const result = compareMetric(
        'uiStartup',
        'p75',
        1000,
        1000,
        DEFAULT_RELATIVE_THRESHOLDS,
      );
      expect(result.severity).toBe(COMPARISON_SEVERITY.Pass.value);
      expect(result.delta).toBe(0);
    });

    it('handles zero baseline', () => {
      const result = compareMetric(
        'load',
        'p75',
        100,
        0,
        DEFAULT_RELATIVE_THRESHOLDS,
      );
      expect(result.deltaPercent).toBe(0);
      expect(result.severity).toBe(COMPARISON_SEVERITY.Pass.value);
    });
  });

  describe('compareBenchmarkEntries', () => {
    const thresholdConfig: ThresholdConfig = {
      uiStartup: {
        p75: { warn: 2000, fail: 2500 },
        p95: { warn: 2500, fail: 3200 },
        ciMultiplier: 1,
      },
    };

    it('passes when within thresholds', () => {
      const results = {
        testTitle: 'test',
        persona: BENCHMARK_PERSONA.STANDARD,
        mean: { uiStartup: 1500 },
        min: { uiStartup: 1000 },
        max: { uiStartup: 2000 },
        stdDev: { uiStartup: 200 },
        p75: { uiStartup: 1800 },
        p95: { uiStartup: 2200 },
      };

      const comparison = compareBenchmarkEntries(
        'standard-home',
        results,
        thresholdConfig,
      );

      expect(comparison.absoluteFailed).toBe(false);
      expect(comparison.absoluteViolations).toHaveLength(0);
    });

    it('fails when p75 exceeds fail threshold', () => {
      const results = {
        testTitle: 'test',
        persona: BENCHMARK_PERSONA.STANDARD,
        mean: { uiStartup: 2600 },
        min: { uiStartup: 2000 },
        max: { uiStartup: 3000 },
        stdDev: { uiStartup: 200 },
        p75: { uiStartup: 2600 },
        p95: { uiStartup: 3000 },
      };

      const comparison = compareBenchmarkEntries(
        'standard-home',
        results,
        thresholdConfig,
      );

      expect(comparison.absoluteFailed).toBe(true);
      expect(comparison.absoluteViolations.length).toBeGreaterThan(0);
    });

    it('warns but does not fail when p75 exceeds warn but not fail', () => {
      const results = {
        testTitle: 'test',
        persona: BENCHMARK_PERSONA.STANDARD,
        mean: { uiStartup: 2100 },
        min: { uiStartup: 1800 },
        max: { uiStartup: 2400 },
        stdDev: { uiStartup: 150 },
        p75: { uiStartup: 2100 },
        p95: { uiStartup: 2400 },
      };

      const comparison = compareBenchmarkEntries(
        'standard-home',
        results,
        thresholdConfig,
      );

      expect(comparison.absoluteFailed).toBe(false);
      expect(comparison.absoluteViolations.length).toBeGreaterThan(0);
      expect(comparison.absoluteViolations[0].severity).toBe(
        COMPARISON_SEVERITY.Warn.value,
      );
    });

    it('includes relative metrics when baseline is provided', () => {
      const results = {
        testTitle: 'test',
        persona: BENCHMARK_PERSONA.STANDARD,
        mean: { uiStartup: 1500 },
        min: { uiStartup: 1000 },
        max: { uiStartup: 2000 },
        stdDev: { uiStartup: 200 },
        p75: { uiStartup: 1800 },
        p95: { uiStartup: 2200 },
      };
      const baseline = {
        uiStartup: { mean: 1400, stdDev: 80, p75: 1700, p95: 2100 },
      };

      const comparison = compareBenchmarkEntries(
        'standard-home',
        results,
        thresholdConfig,
        baseline,
      );

      // stdDev is intentionally excluded from relative metrics (item 18).
      expect(comparison.relativeMetrics).toHaveLength(3);
      expect(comparison.relativeMetrics[0].metric).toBe('uiStartup');
      expect(comparison.relativeMetrics[0].percentile).toBe('mean');
      expect(comparison.relativeMetrics[0].delta).toBeCloseTo(100);
      expect(comparison.relativeMetrics[1].percentile).toBe('p75');
      expect(comparison.relativeMetrics[1].delta).toBeCloseTo(100);
      expect(comparison.relativeMetrics[2].percentile).toBe('p95');
      expect(comparison.relativeMetrics[2].delta).toBeCloseTo(100);
    });

    it('omits relative metrics when no baseline', () => {
      const results = {
        testTitle: 'test',
        persona: BENCHMARK_PERSONA.STANDARD,
        mean: { uiStartup: 1500 },
        min: { uiStartup: 1000 },
        max: { uiStartup: 2000 },
        stdDev: { uiStartup: 200 },
        p75: { uiStartup: 1800 },
        p95: { uiStartup: 2200 },
      };

      const comparison = compareBenchmarkEntries(
        'standard-home',
        results,
        thresholdConfig,
      );

      expect(comparison.relativeMetrics).toHaveLength(0);
    });

    it('skips p95 relative metrics when results.p95 is undefined', () => {
      const p75OnlyConfig = {
        uiStartup: {
          p75: { warn: 2000, fail: 3000 },
        },
      };
      const results: BenchmarkResults = {
        testTitle: 'test',
        persona: 'standard',
        mean: { uiStartup: 1500 },
        min: { uiStartup: 1000 },
        max: { uiStartup: 2000 },
        stdDev: { uiStartup: 200 },
        p75: { uiStartup: 1800 },
        p95: {},
      };
      const baseline = {
        uiStartup: { mean: 1400, stdDev: 80, p75: 1700, p95: 2100 },
      };

      const comparison = compareBenchmarkEntries(
        'test-bench',
        results,
        p75OnlyConfig,
        baseline,
      );

      expect(comparison.relativeMetrics).toHaveLength(2);
      expect(comparison.relativeMetrics[0].percentile).toBe('mean');
      expect(comparison.relativeMetrics[1].percentile).toBe('p75');
    });

    it('skips a stat key when its results map is missing (line 159)', () => {
      const results = {
        p75: { uiStartup: 1800 },
        p95: { uiStartup: 2200 },
      } as unknown as BenchmarkResults;

      const comparison = compareBenchmarkEntries(
        'standard-home',
        results,
        thresholdConfig,
        { uiStartup: { mean: 1400, stdDev: 80, p75: 1700, p95: 2100 } },
      );

      expect(
        comparison.relativeMetrics.some((m) => m.percentile === 'mean'),
      ).toBe(false);
      expect(
        comparison.relativeMetrics.some((m) => m.percentile === 'p75'),
      ).toBe(true);
    });

    it('skips a metric when its baseline value for a specific percentile is absent (line 166)', () => {
      const results: BenchmarkResults = {
        testTitle: 'test',
        persona: 'standard',
        mean: { uiStartup: 1500 },
        min: { uiStartup: 1000 },
        max: { uiStartup: 2000 },
        stdDev: { uiStartup: 200 },
        p75: { uiStartup: 1800 },
        p95: { uiStartup: 2200 },
      };

      const comparison = compareBenchmarkEntries(
        'standard-home',
        results,
        thresholdConfig,
        {
          uiStartup: { mean: 1400, stdDev: 80, p75: 1700 },
        } as unknown as Parameters<typeof compareBenchmarkEntries>[3],
      );

      expect(
        comparison.relativeMetrics.some((m) => m.percentile === 'p95'),
      ).toBe(false);
      expect(
        comparison.relativeMetrics.some((m) => m.percentile === 'p75'),
      ).toBe(true);
    });
  });

  describe('compareBenchmarkEntries — no p75 in results', () => {
    it('skips relative metrics when results.p75 is absent but baseline is provided', () => {
      const p95OnlyConfig: import('../../shared/constants/benchmarks').ThresholdConfig =
        {
          uiStartup: { p95: { warn: 2500, fail: 3200 }, ciMultiplier: 1 },
        };
      const results = {
        testTitle: 'test',
        persona: 'standard',
        mean: { uiStartup: 1500 },
        min: { uiStartup: 1000 },
        max: { uiStartup: 2000 },
        stdDev: { uiStartup: 200 },
        p95: { uiStartup: 2200 },
      } as unknown as import('../../shared/constants/benchmarks').BenchmarkResults;

      const comparison = compareBenchmarkEntries(
        'no-p75',
        results,
        p95OnlyConfig,
        { uiStartup: { mean: 1400, stdDev: 80, p75: 1700, p95: 2100 } },
      );
      expect(comparison.relativeMetrics).toHaveLength(0);
    });
  });

  describe('applyGatingPolicy', () => {
    const violation = (
      metricId: string,
      severity: ThresholdViolation['severity'],
    ): ThresholdViolation => ({
      metricId,
      percentile: 'p75',
      value: 1000,
      threshold: 800,
      severity,
    });

    const baseComparison = (
      benchmarkName: string,
      violations: ThresholdViolation[],
    ): BenchmarkEntryComparison => ({
      benchmarkName,
      relativeMetrics: [],
      absoluteViolations: violations,
      hasRegression: false,
      hasWarning: violations.some(
        (v) => v.severity === THRESHOLD_SEVERITY.Warn,
      ),
      absoluteFailed: violations.some(
        (v) => v.severity === THRESHOLD_SEVERITY.Fail,
      ),
    });

    it('preserves Fail severity when metric is allowlisted', () => {
      const input = baseComparison('startupStandardHome', [
        violation('uiStartup', THRESHOLD_SEVERITY.Fail),
      ]);
      const allow = new Set(['startupStandardHome.uiStartup']);

      const result = applyGatingPolicy(input, allow);

      expect(result.absoluteViolations[0].severity).toBe(
        THRESHOLD_SEVERITY.Fail,
      );
      expect(result.absoluteFailed).toBe(true);
    });

    it('downgrades Fail to Warn when metric is not allowlisted', () => {
      const input = baseComparison('startupPowerUserHome', [
        violation('uiStartup', THRESHOLD_SEVERITY.Fail),
      ]);
      const allow = new Set(['startupStandardHome.uiStartup']);

      const result = applyGatingPolicy(input, allow);

      expect(result.absoluteViolations[0].severity).toBe(
        THRESHOLD_SEVERITY.Warn,
      );
      expect(result.absoluteFailed).toBe(false);
      expect(result.hasWarning).toBe(true);
    });

    it('downgrades only non-allowlisted entries in mixed input', () => {
      const input = baseComparison('startupStandardHome', [
        violation('uiStartup', THRESHOLD_SEVERITY.Fail),
        violation('domContentLoaded', THRESHOLD_SEVERITY.Fail),
      ]);
      const allow = new Set(['startupStandardHome.uiStartup']);

      const result = applyGatingPolicy(input, allow);

      const byMetric = Object.fromEntries(
        result.absoluteViolations.map((v) => [v.metricId, v.severity]),
      );
      expect(byMetric.uiStartup).toBe(THRESHOLD_SEVERITY.Fail);
      expect(byMetric.domContentLoaded).toBe(THRESHOLD_SEVERITY.Warn);
      expect(result.absoluteFailed).toBe(true);
    });

    it('never modifies Warn-severity violations', () => {
      const input = baseComparison('startupPowerUserHome', [
        violation('uiStartup', THRESHOLD_SEVERITY.Warn),
      ]);
      const allow = new Set<string>();

      const result = applyGatingPolicy(input, allow);

      expect(result.absoluteViolations[0].severity).toBe(
        THRESHOLD_SEVERITY.Warn,
      );
      expect(result.absoluteFailed).toBe(false);
    });

    it('downgrades all fails when allowlist is empty', () => {
      const input = baseComparison('startupStandardHome', [
        violation('uiStartup', THRESHOLD_SEVERITY.Fail),
        violation('load', THRESHOLD_SEVERITY.Fail),
      ]);

      const result = applyGatingPolicy(input, new Set());

      expect(
        result.absoluteViolations.every(
          (v) => v.severity === THRESHOLD_SEVERITY.Warn,
        ),
      ).toBe(true);
      expect(result.absoluteFailed).toBe(false);
      expect(result.hasWarning).toBe(true);
    });

    it('does not mutate the input comparison', () => {
      const input = baseComparison('startupPowerUserHome', [
        violation('uiStartup', THRESHOLD_SEVERITY.Fail),
      ]);
      const inputViolationsBefore = input.absoluteViolations.slice();
      const inputSeverityBefore = input.absoluteViolations[0].severity;

      applyGatingPolicy(input, new Set());

      expect(input.absoluteViolations).toStrictEqual(inputViolationsBefore);
      expect(input.absoluteViolations[0].severity).toBe(inputSeverityBefore);
      expect(input.absoluteFailed).toBe(true);
    });

    it('preserves hasWarning derived from relativeMetrics', () => {
      const input: BenchmarkEntryComparison = {
        benchmarkName: 'startupStandardHome',
        relativeMetrics: [
          {
            metric: 'uiStartup',
            percentile: 'p75',
            current: 1100,
            baseline: 1000,
            delta: 100,
            deltaPercent: 0.1,
            severity: COMPARISON_SEVERITY.Warn.value,
            indication: COMPARISON_SEVERITY.Warn.icon,
          },
        ],
        absoluteViolations: [],
        hasRegression: false,
        hasWarning: true,
        absoluteFailed: false,
      };

      const result = applyGatingPolicy(input, new Set());

      expect(result.hasWarning).toBe(true);
    });
  });

  describe('formatDeltaPercent', () => {
    it('formats a positive delta as +X%', () => {
      expect(formatDeltaPercent(0.15)).toBe('+15%');
    });

    it('formats a negative delta as -X%', () => {
      expect(formatDeltaPercent(-0.08)).toBe('-8%');
    });

    it('formats zero as 0.0%', () => {
      expect(formatDeltaPercent(0)).toBe('0.0%');
    });
  });
});

describe('scaleThresholdsForBrowser', () => {
  const baseConfig: ThresholdConfig = {
    someMetric: {
      p75: { warn: 1000, fail: 1200 },
      p95: { warn: 1100, fail: 1400 },
      ciMultiplier: 1.5,
    },
    cls: {
      p75: { warn: 0.1, fail: 0.25 },
      ciMultiplier: 1, // CI_MULTIPLIER.NONE — unitless
    },
  };

  it('returns config unchanged when no browser is provided', () => {
    expect(scaleThresholdsForBrowser(baseConfig)).toBe(baseConfig);
  });

  it('returns config unchanged for chrome (no multiplier entry)', () => {
    expect(scaleThresholdsForBrowser(baseConfig, 'chrome')).toBe(baseConfig);
  });

  it('scales p75/p95 for timed metrics on firefox', () => {
    const scaled = scaleThresholdsForBrowser(baseConfig, 'firefox');
    expect(scaled.someMetric.p75).toStrictEqual({ warn: 2000, fail: 2400 });
    expect(scaled.someMetric.p95).toStrictEqual({ warn: 2200, fail: 2800 });
  });

  it('does not scale unitless metrics (ciMultiplier === 1) on firefox', () => {
    const scaled = scaleThresholdsForBrowser(baseConfig, 'firefox');
    expect(scaled.cls.p75).toStrictEqual({ warn: 0.1, fail: 0.25 });
  });

  it('preserves ciMultiplier on scaled metrics', () => {
    const scaled = scaleThresholdsForBrowser(baseConfig, 'firefox');
    expect(scaled.someMetric.ciMultiplier).toBe(1.5);
  });
});

describe('THRESHOLD_REGISTRY', () => {
  it('has platform-agnostic keys for interaction (runs on 4 combos)', () => {
    expect(THRESHOLD_REGISTRY.loadNewAccount).toBeDefined();
    expect(THRESHOLD_REGISTRY.confirmTx).toBeDefined();
    expect(THRESHOLD_REGISTRY.bridgeUserActions).toBeDefined();
    expect(THRESHOLD_REGISTRY['chrome-webpack-loadNewAccount']).toBeUndefined();
  });

  it('has platform-agnostic keys for user journey (no per-platform threshold keys)', () => {
    expect(THRESHOLD_REGISTRY.onboardingImportWallet).toBeDefined();
    expect(THRESHOLD_REGISTRY.swap).toBeDefined();
    expect(THRESHOLD_REGISTRY['chrome-webpack-swap']).toBeUndefined();
  });

  it('has startup benchmarks without platform prefixes', () => {
    expect(THRESHOLD_REGISTRY.startupStandardHome).toBeDefined();
    expect(THRESHOLD_REGISTRY.startupPowerUserHome).toBeDefined();
    expect(
      THRESHOLD_REGISTRY['chrome-webpack-startupStandardHome'],
    ).toBeUndefined();
    expect(
      THRESHOLD_REGISTRY['firefox-webpack-startupPowerUserHome'],
    ).toBeUndefined();
  });
});
