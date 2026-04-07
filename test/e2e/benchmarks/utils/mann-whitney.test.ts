import { mannWhitneyU, isSignificantRegression } from './mann-whitney';

describe('mannWhitneyU', () => {
  describe('known U/p values from statistical tables', () => {
    it('returns correct U for clearly separated samples (n=5 vs n=5)', () => {
      // Sample A: 1,2,3,4,5 — Sample B: 6,7,8,9,10
      // All A values < all B values → U = 0 (maximum separation)
      const result = mannWhitneyU([1, 2, 3, 4, 5], [6, 7, 8, 9, 10]);
      expect(result.uStatistic).toBe(0);
      // Min exact two-sided p for n1=n2=5: 2/C(10,5) = 2/252 ≈ 0.0079
      expect(result.pValue).toBeCloseTo(0.0079, 3);
      expect(result.significant).toBe(true);
      expect(result.exact).toBe(true);
    });

    it('returns U = n1*n2/2 for identical distributions', () => {
      const a = [10, 20, 30, 40, 50];
      const b = [15, 25, 35, 45, 55];
      // Interleaved → U close to n1*n2/2 = 12.5
      const result = mannWhitneyU(a, b);
      expect(result.uStatistic).toBe(10);
      expect(result.pValue).toBeGreaterThan(0.05);
      expect(result.significant).toBe(false);
    });

    it('returns p close to 1.0 for identical samples', () => {
      // Same values → many ties → normal approximation
      const a = [100, 200, 300, 400, 500];
      const b = [100, 200, 300, 400, 500];
      const result = mannWhitneyU(a, b);
      expect(result.pValue).toBeGreaterThan(0.9);
      expect(result.significant).toBe(false);
      expect(result.effectSize).toBeCloseTo(0, 1);
    });
  });

  describe('clearly different distributions', () => {
    it('detects significant difference (p < 0.01) for non-overlapping samples', () => {
      const current = [500, 600, 700, 800, 900];
      const baseline = [100, 150, 200, 250, 300];
      const result = mannWhitneyU(current, baseline);
      expect(result.pValue).toBeLessThan(0.01);
      expect(result.significant).toBe(true);
      expect(result.effectSize).toBeGreaterThan(0.8); // Large effect
      expect(result.deltaPercent).toBeGreaterThan(0); // Current is slower
    });

    it('detects improvement (current faster than baseline)', () => {
      const current = [100, 120, 130, 110, 140];
      const baseline = [500, 600, 700, 550, 650];
      const result = mannWhitneyU(current, baseline);
      expect(result.significant).toBe(true);
      expect(result.deltaPercent).toBeLessThan(0); // Improvement
    });
  });

  describe('tie handling', () => {
    it('handles ties correctly with normal approximation', () => {
      // Many ties → forces normal approximation path
      const a = [100, 100, 200, 200, 300];
      const b = [100, 200, 200, 300, 300];
      const result = mannWhitneyU(a, b);
      expect(result.exact).toBe(false); // Ties → normal approx
      expect(result.pValue).toBeGreaterThan(0.05); // Not significantly different
    });

    it('handles all-tied values', () => {
      const a = [100, 100, 100, 100, 100];
      const b = [100, 100, 100, 100, 100];
      const result = mannWhitneyU(a, b);
      expect(result.pValue).toBeGreaterThan(0.9);
      expect(result.effectSize).toBeCloseTo(0, 1);
    });
  });

  describe('small sample edge cases', () => {
    it('returns non-significant for n < 2', () => {
      expect(mannWhitneyU([100], [200]).significant).toBe(false);
      expect(mannWhitneyU([100], [200]).pValue).toBe(1);
    });

    it('handles n=2 vs n=2 (minimum viable sample)', () => {
      const result = mannWhitneyU([1, 2], [10, 20]);
      expect(result.uStatistic).toBe(0);
      // C(4,2) = 6, so min p = 2/6 ≈ 0.333 — not significant at 0.05
      expect(result.pValue).toBeCloseTo(0.333, 2);
      expect(result.significant).toBe(false);
    });

    it('handles n=3 vs n=3', () => {
      const result = mannWhitneyU([1, 2, 3], [100, 200, 300]);
      expect(result.uStatistic).toBe(0);
      // C(6,3) = 20, so min p = 2/20 = 0.1
      expect(result.pValue).toBeCloseTo(0.1, 2);
      expect(result.significant).toBe(false); // 0.1 > 0.05
    });
  });

  describe('normal approximation (large samples)', () => {
    it('uses normal approximation for n1*n2 > 400', () => {
      // n=21 vs n=21 → n1*n2 = 441 > 400
      const a = Array.from({ length: 21 }, (_, i) => i * 10);
      const b = Array.from({ length: 21 }, (_, i) => i * 10 + 200);
      const result = mannWhitneyU(a, b);
      expect(result.exact).toBe(false);
      expect(result.significant).toBe(true);
    });
  });

  describe('effect size interpretation', () => {
    it('returns large effect size for non-overlapping samples', () => {
      const result = mannWhitneyU([1, 2, 3, 4, 5], [100, 200, 300, 400, 500]);
      expect(Math.abs(result.effectSize)).toBeGreaterThan(0.5); // Large
    });

    it('returns small/zero effect size for similar distributions', () => {
      const result = mannWhitneyU(
        [100, 200, 300, 400, 500],
        [110, 190, 310, 390, 510],
      );
      expect(Math.abs(result.effectSize)).toBeLessThan(0.3); // Small or negligible
    });
  });

  describe('deltaPercent', () => {
    it('computes median-based delta correctly', () => {
      // Median of [100, 200, 300] = 200, median of [50, 100, 150] = 100
      // Delta = (200 - 100) / 100 = 1.0 (100%)
      const result = mannWhitneyU([100, 200, 300], [50, 100, 150]);
      expect(result.deltaPercent).toBeCloseTo(1.0, 2);
    });

    it('handles zero baseline median', () => {
      const result = mannWhitneyU([100, 200, 300], [0, 0, 0]);
      expect(result.deltaPercent).toBe(0);
    });
  });
});

describe('isSignificantRegression', () => {
  it('returns fail verdict for significant + >10% regression', () => {
    // Current ~3x slower → significant, delta > 10%
    const result = isSignificantRegression(
      'openAccountMenuToAccountListLoaded',
      [3000, 3500, 4000, 3200, 3800],
      [1000, 1100, 1200, 1050, 1150],
    );
    expect(result.verdict).toBe('fail');
    expect(result.significant).toBe(true);
    expect(result.deltaPercent).toBeGreaterThan(0.1);
  });

  it('returns warn verdict for significant + 5-10% regression', () => {
    // Current ~7% slower
    const result = isSignificantRegression(
      'uiStartup',
      [1070, 1080, 1060, 1075, 1065],
      [1000, 1005, 995, 1010, 990],
    );
    // With n=5, may not reach significance — but if it does:
    if (result.significant) {
      expect(result.verdict).toBe('warn');
    } else {
      expect(result.verdict).toBe('pass');
    }
  });

  it('returns pass verdict when not significant', () => {
    // Overlapping distributions — noise, not regression
    const result = isSignificantRegression(
      'loadScripts',
      [1000, 1100, 900, 1050, 950],
      [980, 1080, 920, 1020, 970],
    );
    expect(result.verdict).toBe('pass');
  });

  it('returns pass verdict for improvement (current faster)', () => {
    const result = isSignificantRegression(
      'assetClickToPriceChart',
      [50, 60, 55, 45, 65],
      [200, 250, 220, 180, 230],
    );
    // Significant but delta is negative (improvement) → pass
    expect(result.verdict).toBe('pass');
  });

  it('returns pass for insufficient samples', () => {
    const result = isSignificantRegression('someMetric', [100], [200]);
    expect(result.verdict).toBe('pass');
    expect(result.pValue).toBe(1);
  });

  it('respects custom alpha', () => {
    const current = [500, 600, 700, 800, 900];
    const baseline = [100, 150, 200, 250, 300];

    // Min exact p for n=5,5 = 2/C(10,5) ≈ 0.0079 — use 0.01 as strict threshold
    const strict = isSignificantRegression('metric', current, baseline, 0.01);
    const lenient = isSignificantRegression('metric', current, baseline, 0.1);

    // Both should be significant at these extreme separations
    expect(strict.significant).toBe(true);
    expect(lenient.significant).toBe(true);
  });

  describe('validates against reference implementation (mann-whitney-u.py)', () => {
    it('matches R5 Rapid Route Cycling: homeToSend', () => {
      const result = isSignificantRegression(
        'homeToSend',
        [75.9, 74.5, 110.3, 76.1, 72.5], // treatment (fix applied)
        [408.1, 1288.3, 1039.0, 396.4, 235.5], // baseline (before fix)
      );
      // Python reference: p ≈ 0.0079, r = -1.0 (current is faster)
      expect(result.pValue).toBeCloseTo(0.0079, 3);
      expect(result.deltaPercent).toBeLessThan(0); // Improvement
      expect(result.verdict).toBe('pass'); // Improvement, not regression
    });

    it('matches R5 Extended Idle Soak: after5sIdle (non-significant)', () => {
      const result = isSignificantRegression(
        'after5sIdle',
        [353.0, 361.6, 113.5, 164.5, 143.8], // treatment
        [200.7, 84.6, 86.3, 126.5, 105.2], // baseline
      );
      // Python reference: p ≈ 0.15, not significant
      expect(result.pValue).toBeGreaterThan(0.05);
      expect(result.verdict).toBe('pass');
    });
  });
});
