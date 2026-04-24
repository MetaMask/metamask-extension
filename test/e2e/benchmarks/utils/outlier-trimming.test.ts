import { detectOutliersIQR } from './statistics';

describe('detectOutliersIQR (IQR-based)', () => {
  describe('small sample edge cases', () => {
    it('returns empty array unchanged', () => {
      const result = detectOutliersIQR([]);
      expect(result.filtered).toEqual([]);
      expect(result.outlierCount).toBe(0);
    });

    it('returns array of 1 unchanged', () => {
      const result = detectOutliersIQR([500]);
      expect(result.filtered).toEqual([500]);
      expect(result.outlierCount).toBe(0);
    });

    it('returns array of 2 unchanged', () => {
      const result = detectOutliersIQR([100, 200]);
      expect(result.filtered).toEqual([100, 200]);
      expect(result.outlierCount).toBe(0);
    });

    it('returns array of 3 unchanged (below IQR threshold)', () => {
      const result = detectOutliersIQR([100, 200, 9000]);
      expect(result.filtered).toEqual([100, 200, 9000]);
      expect(result.outlierCount).toBe(0);
    });
  });

  describe('no outliers', () => {
    it('returns all values when distribution is tight', () => {
      const samples = [100, 101, 99, 102, 98, 100, 101, 99];
      const result = detectOutliersIQR(samples);
      expect(result.outlierCount).toBe(0);
      expect(result.filtered).toHaveLength(samples.length);
    });

    it('returns all values when all samples are identical', () => {
      const samples = [200, 200, 200, 200, 200, 200];
      const result = detectOutliersIQR(samples);
      expect(result.outlierCount).toBe(0);
      expect(result.filtered).toHaveLength(samples.length);
    });
  });

  describe('outlier removal', () => {
    it('removes a single high outlier', () => {
      const samples = [10, 11, 12, 10, 11, 12, 11, 1000];
      const result = detectOutliersIQR(samples);
      expect(result.filtered).not.toContain(1000);
      expect(result.outlierCount).toBe(1);
    });

    it('removes a single low outlier', () => {
      const samples = [100, 102, 101, 103, 100, 101, 1];
      const result = detectOutliersIQR(samples);
      expect(result.filtered).not.toContain(1);
      expect(result.outlierCount).toBe(1);
    });

    it('removes multiple outliers on both ends', () => {
      const samples = [1, 100, 101, 102, 100, 101, 103, 9999];
      const result = detectOutliersIQR(samples);
      expect(result.filtered).not.toContain(1);
      expect(result.filtered).not.toContain(9999);
      expect(result.outlierCount).toBe(2);
    });

    it('preserves non-outlier values exactly', () => {
      const core = [100, 105, 95, 102, 98, 101];
      const samples = [...core, 5000];
      const result = detectOutliersIQR(samples);
      for (const v of core) {
        expect(result.filtered).toContain(v);
      }
    });
  });

  describe('realistic benchmark scenario (n=15)', () => {
    it('removes exactly 2 outliers from a deterministic 15-sample benchmark run', () => {
      // Q1=318, Q3=328, IQR=10, upper fence=343 — 850 and 900 both exceed it
      const normal = [
        320, 330, 315, 325, 318, 322, 328, 316, 319, 324, 321, 323, 317,
      ];
      const withSpikes = [...normal, 900, 850]; // two cold-start spikes
      const result = detectOutliersIQR(withSpikes);
      expect(result.outlierCount).toBe(2);
      expect(result.filtered).toHaveLength(13);
    });

    it('does not over-trim a low-variance run', () => {
      const stable = [
        300, 302, 298, 301, 299, 303, 300, 301, 302, 298, 300, 301, 299, 302,
        300,
      ];
      const result = detectOutliersIQR(stable);
      expect(result.outlierCount).toBe(0);
      expect(result.filtered).toHaveLength(stable.length);
    });
  });

  describe('input ordering', () => {
    it('produces the same outlierCount regardless of input order', () => {
      const ordered = [10, 11, 12, 13, 14, 15, 1000];
      const shuffled = [1000, 13, 10, 15, 12, 11, 14];
      const r1 = detectOutliersIQR(ordered);
      const r2 = detectOutliersIQR(shuffled);
      expect(r1.outlierCount).toBe(r2.outlierCount);
      expect(r1.filtered.sort((a, b) => a - b)).toEqual(
        r2.filtered.sort((a, b) => a - b),
      );
    });

    it('does not mutate the input array (n >= 4, filter path)', () => {
      const samples = [10, 11, 1000, 12, 13];
      const copy = [...samples];
      detectOutliersIQR(samples);
      expect(samples).toEqual(copy);
    });

    it('does not mutate the input array (n < 4, early-return path)', () => {
      const samples = [100, 200, 9000];
      const copy = [...samples];
      const result = detectOutliersIQR(samples);
      expect(samples).toEqual(copy);
      // returned array must not be the same reference
      result.filtered.push(999);
      expect(samples).toEqual(copy);
    });
  });
});
