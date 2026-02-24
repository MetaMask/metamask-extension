import {
  calculateMean,
  calculateStdDev,
  calculatePercentile,
  calculateZScore,
  detectOutliersZScore,
  detectOutliersIQR,
  detectOutliers,
  assessDataQuality,
  validateMetricValue,
  filterBySanityChecks,
  calculateTimerStatistics,
  checkExclusionRate,
  validateTimerThreshold,
  validateThresholds,
  getEffectiveThreshold,
  MAX_METRIC_DURATION_MS,
} from './statistics';
import type { ThresholdConfig, TimerStatistics } from './types';

function createMockStats(
  overrides: Partial<TimerStatistics> = {},
): TimerStatistics {
  return {
    id: 'testMetric',
    mean: 1000,
    min: 800,
    max: 1200,
    stdDev: 100,
    cv: 10,
    p50: 1000,
    p75: 1100,
    p95: 1180,
    p99: 1195,
    samples: 10,
    outliers: 0,
    dataQuality: 'good',
    ...overrides,
  };
}

describe('Statistics Utils', () => {
  describe('calculateMean', () => {
    it('returns 0 for empty array', () => {
      expect(calculateMean([])).toBe(0);
    });

    it('calculates mean correctly', () => {
      expect(calculateMean([1, 2, 3, 4, 5])).toBe(3);
      expect(calculateMean([10, 20, 30])).toBe(20);
      expect(calculateMean([100])).toBe(100);
    });
  });

  describe('calculateStdDev', () => {
    it('returns 0 for empty array', () => {
      expect(calculateStdDev([])).toBe(0);
    });

    it('returns 0 for single value', () => {
      expect(calculateStdDev([100])).toBe(0);
    });

    it('calculates standard deviation correctly', () => {
      const stdDev = calculateStdDev([2, 4, 6, 8, 10]);
      expect(stdDev).toBeCloseTo(2.83, 1);
    });

    it('returns 0 for identical values', () => {
      expect(calculateStdDev([5, 5, 5, 5])).toBe(0);
    });
  });

  describe('calculatePercentile', () => {
    it('returns 0 for empty array', () => {
      expect(calculatePercentile([], 50)).toBe(0);
    });

    it('returns first element for p <= 0', () => {
      expect(calculatePercentile([10, 20, 30, 40], 0)).toBe(10);
      expect(calculatePercentile([10, 20, 30, 40], -10)).toBe(10);
    });

    it('returns last element for p >= 100', () => {
      expect(calculatePercentile([10, 20, 30, 40], 100)).toBe(40);
      expect(calculatePercentile([10, 20, 30, 40], 150)).toBe(40);
    });

    it('calculates p50 (median) correctly', () => {
      expect(calculatePercentile([10, 20, 30, 40], 50)).toBe(20);
      expect(calculatePercentile([10, 20, 30, 40, 50], 50)).toBe(30);
    });

    it('calculates p75 correctly using nearest-rank', () => {
      expect(calculatePercentile([100, 200, 300, 400], 75)).toBe(300);
    });

    it('calculates p95 correctly', () => {
      const values = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      expect(calculatePercentile(values, 95)).toBe(10);
    });
  });

  describe('calculateZScore', () => {
    it('returns 0 when stdDev is 0', () => {
      expect(calculateZScore(100, 100, 0)).toBe(0);
    });

    it('calculates z-score correctly', () => {
      expect(calculateZScore(110, 100, 10)).toBe(1);
      expect(calculateZScore(90, 100, 10)).toBe(-1);
      expect(calculateZScore(130, 100, 10)).toBe(3);
    });
  });

  describe('detectOutliersZScore', () => {
    it('returns original array for less than 3 values', () => {
      const result = detectOutliersZScore([100, 200]);
      expect(result.filtered).toEqual([100, 200]);
      expect(result.outlierCount).toBe(0);
    });

    it('returns correct structure with outlier count', () => {
      const values = [100, 102, 104, 106, 108];
      const result = detectOutliersZScore(values);
      expect(result).toHaveProperty('filtered');
      expect(result).toHaveProperty('outlierCount');
      expect(result).toHaveProperty('outliers');
      expect(Array.isArray(result.filtered)).toBe(true);
      expect(Array.isArray(result.outliers)).toBe(true);
    });

    it('keeps all values when no outliers', () => {
      const values = [100, 102, 98, 101, 99];
      const result = detectOutliersZScore(values);
      expect(result.filtered).toEqual(values);
      expect(result.outlierCount).toBe(0);
    });
  });

  describe('detectOutliersIQR', () => {
    it('returns original array for less than 4 values', () => {
      const result = detectOutliersIQR([100, 200, 300]);
      expect(result.filtered).toEqual([100, 200, 300]);
      expect(result.outlierCount).toBe(0);
    });

    it('detects outliers outside IQR bounds', () => {
      // Values with clear outlier
      const values = [10, 12, 11, 13, 12, 11, 100];
      const result = detectOutliersIQR(values);
      expect(result.outliers).toContain(100);
      expect(result.outlierCount).toBe(1);
    });
  });

  describe('detectOutliers (combined)', () => {
    it('combines IQR and z-score detection', () => {
      const values = [100, 101, 99, 102, 98, 100, 1000];
      const result = detectOutliers(values);
      expect(result.filtered).not.toContain(1000);
      expect(result.outlierCount).toBeGreaterThan(0);
    });
  });

  describe('assessDataQuality', () => {
    it('returns good for CV < 30', () => {
      expect(assessDataQuality(10)).toBe('good');
      expect(assessDataQuality(29)).toBe('good');
    });

    it('returns poor for CV between 30 and 50', () => {
      expect(assessDataQuality(30)).toBe('poor');
      expect(assessDataQuality(49)).toBe('poor');
    });

    it('returns unreliable for CV >= 50', () => {
      expect(assessDataQuality(50)).toBe('unreliable');
      expect(assessDataQuality(100)).toBe('unreliable');
    });
  });

  describe('validateMetricValue', () => {
    it('rejects zero or negative values', () => {
      expect(validateMetricValue(0).valid).toBe(false);
      expect(validateMetricValue(-1).valid).toBe(false);
    });

    it('rejects values below minimum', () => {
      expect(validateMetricValue(0.5).valid).toBe(false);
    });

    it('rejects values above maximum', () => {
      expect(validateMetricValue(MAX_METRIC_DURATION_MS + 1).valid).toBe(false);
    });

    it('accepts valid values', () => {
      expect(validateMetricValue(100).valid).toBe(true);
      expect(validateMetricValue(1000).valid).toBe(true);
    });

    it('respects custom thresholds', () => {
      expect(validateMetricValue(50, 100, 10).valid).toBe(true);
      expect(validateMetricValue(5, 100, 10).valid).toBe(false);
      expect(validateMetricValue(150, 100, 10).valid).toBe(false);
    });
  });

  describe('filterBySanityChecks', () => {
    it('filters out invalid values', () => {
      const values = [100, 0, 200, -5, 300, MAX_METRIC_DURATION_MS + 1];
      const result = filterBySanityChecks(values);
      expect(result.filtered).toEqual([100, 200, 300]);
      expect(result.excludedCount).toBe(3);
    });

    it('keeps all valid values', () => {
      const values = [100, 200, 300];
      const result = filterBySanityChecks(values);
      expect(result.filtered).toEqual(values);
      expect(result.excludedCount).toBe(0);
    });
  });

  describe('calculateTimerStatistics', () => {
    it('calculates complete statistics', () => {
      const durations = [100, 110, 105, 108, 102, 107, 103, 109, 104, 106];
      const stats = calculateTimerStatistics('testTimer', durations);

      expect(stats.id).toBe('testTimer');
      expect(stats.mean).toBeCloseTo(105.4, 1);
      expect(stats.min).toBeLessThanOrEqual(stats.mean);
      expect(stats.max).toBeGreaterThanOrEqual(stats.mean);
      expect(stats.samples).toBe(10);
      expect(stats.dataQuality).toBe('good');
    });

    it('handles empty array', () => {
      const stats = calculateTimerStatistics('emptyTimer', []);
      expect(stats.mean).toBe(0);
      expect(stats.min).toBe(0);
      expect(stats.max).toBe(0);
      expect(stats.samples).toBe(0);
    });

    it('excludes invalid values and outliers', () => {
      const durations = [100, 105, 102, 0, -5, 10000000];
      const stats = calculateTimerStatistics('mixedTimer', durations);
      expect(stats.samples).toBeLessThan(durations.length);
      expect(stats.outliers).toBeGreaterThan(0);
    });
  });

  describe('checkExclusionRate', () => {
    it('passes when exclusion rate is within limit', () => {
      const result = checkExclusionRate(10, 3); // 30%
      expect(result.passed).toBe(true);
      expect(result.rate).toBeCloseTo(0.3, 2);
    });

    it('fails when exclusion rate exceeds limit', () => {
      const result = checkExclusionRate(10, 6); // 60%
      expect(result.passed).toBe(false);
      expect(result.rate).toBeCloseTo(0.6, 2);
    });

    it('handles zero total runs', () => {
      const result = checkExclusionRate(0, 0);
      expect(result.passed).toBe(true);
      expect(result.rate).toBe(0);
    });
  });

  describe('getEffectiveThreshold', () => {
    const originalCI = process.env.CI;

    afterEach(() => {
      process.env.CI = originalCI;
    });

    it('returns base threshold when not in CI', () => {
      delete process.env.CI;
      expect(getEffectiveThreshold(1000, 1.5)).toBe(1000);
    });

    it('applies multiplier in CI environment', () => {
      process.env.CI = 'true';
      expect(getEffectiveThreshold(1000, 1.5)).toBe(1500);
    });

    it('returns base threshold when no multiplier provided', () => {
      process.env.CI = 'true';
      expect(getEffectiveThreshold(1000)).toBe(1000);
    });
  });

  describe('validateTimerThreshold', () => {
    it('returns no violations when within thresholds', () => {
      const stats = createMockStats();
      const thresholds = {
        p75: { warn: 1200, fail: 1500 },
        p95: { warn: 1300, fail: 1600 },
      };
      const violations = validateTimerThreshold(stats, thresholds);
      expect(violations).toHaveLength(0);
    });

    it('returns warn violation when exceeds warn threshold', () => {
      const stats = createMockStats();
      const thresholds = {
        p75: { warn: 1000, fail: 1500 },
      };
      const violations = validateTimerThreshold(stats, thresholds);
      expect(violations).toHaveLength(1);
      expect(violations[0].severity).toBe('warn');
    });

    it('returns fail violation when exceeds fail threshold', () => {
      const stats = createMockStats();
      const thresholds = {
        p75: { warn: 500, fail: 1000 },
      };
      const violations = validateTimerThreshold(stats, thresholds);
      expect(violations).toHaveLength(1);
      expect(violations[0].severity).toBe('fail');
    });
  });

  describe('validateThresholds', () => {
    it('skips metrics without configured thresholds', () => {
      const stats: TimerStatistics[] = [
        {
          id: 'unconfiguredMetric',
          mean: 10000,
          min: 9000,
          max: 11000,
          stdDev: 500,
          cv: 5,
          p50: 10000,
          p75: 10500,
          p95: 10900,
          p99: 10950,
          samples: 10,
          outliers: 0,
          dataQuality: 'good',
        },
      ];
      const config: ThresholdConfig = {};
      const result = validateThresholds(stats, config);
      expect(result.violations).toHaveLength(0);
      expect(result.passed).toBe(true);
    });

    it('skips unreliable data', () => {
      const stats: TimerStatistics[] = [
        {
          id: 'unreliableMetric',
          mean: 10000,
          min: 1000,
          max: 50000,
          stdDev: 15000,
          cv: 150,
          p50: 8000,
          p75: 20000,
          p95: 45000,
          p99: 49000,
          samples: 10,
          outliers: 0,
          dataQuality: 'unreliable',
        },
      ];
      const config: ThresholdConfig = {
        unreliableMetric: {
          p75: { warn: 1000, fail: 2000 },
        },
      };
      const result = validateThresholds(stats, config);
      expect(result.violations).toHaveLength(0);
    });

    it('returns passed=false only for fail violations', () => {
      const stats: TimerStatistics[] = [
        {
          id: 'warnMetric',
          mean: 1000,
          min: 800,
          max: 1200,
          stdDev: 100,
          cv: 10,
          p50: 1000,
          p75: 1100,
          p95: 1180,
          p99: 1195,
          samples: 10,
          outliers: 0,
          dataQuality: 'good',
        },
      ];
      const config: ThresholdConfig = {
        warnMetric: {
          p75: { warn: 1000, fail: 2000 },
        },
      };
      const result = validateThresholds(stats, config);
      expect(result.violations).toHaveLength(1);
      expect(result.violations[0].severity).toBe('warn');
      expect(result.passed).toBe(true); // Only warn, not fail
    });
  });
});
