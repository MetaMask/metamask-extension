import type {
  BenchmarkResults,
  ThresholdConfig,
} from '../../shared/constants/benchmarks';
import { DEFAULT_RELATIVE_THRESHOLDS } from '../../shared/constants/benchmarks';

import {
  compareMetric,
  compareBenchmarkEntries,
  getTrafficLightIndication,
  formatDeltaPercent,
  ComparisonSeverity,
  ComparisonDirection,
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
      expect(result.severity).toBe(ComparisonSeverity.Regression);
      expect(result.direction).toBe(ComparisonDirection.Slower);
      expect(result.indication).toBe('🔺');
      expect(result.deltaPercent).toBeCloseTo(0.1);
      expect(result.percentile).toBe('p75');
    });

    it('classifies a >10% improvement', () => {
      const result = compareMetric(
        'uiStartup',
        'p75',
        900,
        1000,
        DEFAULT_RELATIVE_THRESHOLDS,
      );
      expect(result.severity).toBe(ComparisonSeverity.Improvement);
      expect(result.direction).toBe(ComparisonDirection.Faster);
      expect(result.indication).toBe('🟢⬇️');
    });

    it('classifies 5-10% as warn', () => {
      const result = compareMetric(
        'uiStartup',
        'p95',
        1060,
        1000,
        DEFAULT_RELATIVE_THRESHOLDS,
      );
      expect(result.severity).toBe(ComparisonSeverity.Warn);
      expect(result.direction).toBe(ComparisonDirection.Slower);
      expect(result.indication).toBe('🟡⬆️');
      expect(result.percentile).toBe('p95');
    });

    it('classifies <5% as neutral', () => {
      const result = compareMetric(
        'uiStartup',
        'p75',
        1020,
        1000,
        DEFAULT_RELATIVE_THRESHOLDS,
      );
      expect(result.severity).toBe(ComparisonSeverity.Neutral);
      expect(result.indication).toBe('➡️');
    });

    it('handles identical values', () => {
      const result = compareMetric(
        'uiStartup',
        'p75',
        1000,
        1000,
        DEFAULT_RELATIVE_THRESHOLDS,
      );
      expect(result.severity).toBe(ComparisonSeverity.Neutral);
      expect(result.direction).toBe(ComparisonDirection.Same);
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
      expect(result.severity).toBe(ComparisonSeverity.Neutral);
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
        persona: 'standard' as const,
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
        persona: 'standard' as const,
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
        persona: 'standard' as const,
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
      expect(comparison.absoluteViolations[0].severity).toBe('warn');
    });

    it('includes relative metrics when baseline is provided', () => {
      const results = {
        testTitle: 'test',
        persona: 'standard' as const,
        mean: { uiStartup: 1500 },
        min: { uiStartup: 1000 },
        max: { uiStartup: 2000 },
        stdDev: { uiStartup: 200 },
        p75: { uiStartup: 1800 },
        p95: { uiStartup: 2200 },
      };
      const baseline = {
        uiStartup: { mean: 1400, p75: 1700, p95: 2100 },
      };

      const comparison = compareBenchmarkEntries(
        'standard-home',
        results,
        thresholdConfig,
        baseline,
      );

      expect(comparison.relativeMetrics).toHaveLength(2);
      expect(comparison.relativeMetrics[0].metric).toBe('uiStartup');
      expect(comparison.relativeMetrics[0].percentile).toBe('p75');
      expect(comparison.relativeMetrics[0].delta).toBeCloseTo(100);
      expect(comparison.relativeMetrics[1].percentile).toBe('p95');
      expect(comparison.relativeMetrics[1].delta).toBeCloseTo(100);
    });

    it('omits relative metrics when no baseline', () => {
      const results = {
        testTitle: 'test',
        persona: 'standard' as const,
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
      const results = {
        testTitle: 'test',
        persona: 'standard' as const,
        mean: { uiStartup: 1500 },
        min: { uiStartup: 1000 },
        max: { uiStartup: 2000 },
        stdDev: { uiStartup: 200 },
        p75: { uiStartup: 1800 },
      } as BenchmarkResults;
      const baseline = {
        uiStartup: { mean: 1400, p75: 1700, p95: 2100 },
      };

      const comparison = compareBenchmarkEntries(
        'test-bench',
        results,
        p75OnlyConfig,
        baseline,
      );

      expect(comparison.relativeMetrics).toHaveLength(1);
      expect(comparison.relativeMetrics[0].percentile).toBe('p75');
    });
  });

  describe('getTrafficLightIndication', () => {
    it('returns 🔺 for regression slower', () => {
      expect(
        getTrafficLightIndication(
          ComparisonSeverity.Regression,
          ComparisonDirection.Slower,
        ),
      ).toBe('🔺');
    });

    it('returns 🔻 for regression faster', () => {
      expect(
        getTrafficLightIndication(
          ComparisonSeverity.Regression,
          ComparisonDirection.Faster,
        ),
      ).toBe('🔻');
    });

    it('returns 🟡⬆️ for warn slower', () => {
      expect(
        getTrafficLightIndication(
          ComparisonSeverity.Warn,
          ComparisonDirection.Slower,
        ),
      ).toBe('🟡⬆️');
    });

    it('returns 🟡⬇️ for warn faster', () => {
      expect(
        getTrafficLightIndication(
          ComparisonSeverity.Warn,
          ComparisonDirection.Faster,
        ),
      ).toBe('🟡⬇️');
    });

    it('returns 🟢⬇️ for improvement faster', () => {
      expect(
        getTrafficLightIndication(
          ComparisonSeverity.Improvement,
          ComparisonDirection.Faster,
        ),
      ).toBe('🟢⬇️');
    });

    it('returns ➡️ for neutral', () => {
      expect(
        getTrafficLightIndication(
          ComparisonSeverity.Neutral,
          ComparisonDirection.Same,
        ),
      ).toBe('➡️');
    });
  });

  describe('formatDeltaPercent', () => {
    it('formats slower as positive', () => {
      expect(formatDeltaPercent(0.15, ComparisonDirection.Slower)).toBe(
        '+15.0%',
      );
    });

    it('formats faster as negative', () => {
      expect(formatDeltaPercent(-0.08, ComparisonDirection.Faster)).toBe(
        '-8.0%',
      );
    });

    it('formats same as 0.0%', () => {
      expect(formatDeltaPercent(0, ComparisonDirection.Same)).toBe('0.0%');
    });
  });
});
