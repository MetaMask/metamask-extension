import { trimOutliers } from './statistics';

describe('trimOutliers (IQR-based)', () => {
  describe('small sample edge cases', () => {
    it('returns empty array unchanged', () => {
      const result = trimOutliers([]);
      expect(result.samples).toEqual([]);
      expect(result.trimmedCount).toBe(0);
    });

    it('returns array of 1 unchanged', () => {
      const result = trimOutliers([500]);
      expect(result.samples).toEqual([500]);
      expect(result.trimmedCount).toBe(0);
    });

    it('returns array of 2 unchanged', () => {
      const result = trimOutliers([100, 200]);
      expect(result.samples).toEqual([100, 200]);
      expect(result.trimmedCount).toBe(0);
    });

    it('returns array of 3 unchanged (below IQR threshold)', () => {
      const result = trimOutliers([100, 200, 9000]);
      expect(result.samples).toEqual([100, 200, 9000]);
      expect(result.trimmedCount).toBe(0);
    });
  });

  describe('no outliers', () => {
    it('returns all values when distribution is tight', () => {
      const samples = [100, 101, 99, 102, 98, 100, 101, 99];
      const result = trimOutliers(samples);
      expect(result.trimmedCount).toBe(0);
      expect(result.samples).toHaveLength(samples.length);
    });

    it('returns all values when all samples are identical', () => {
      const samples = [200, 200, 200, 200, 200, 200];
      const result = trimOutliers(samples);
      expect(result.trimmedCount).toBe(0);
      expect(result.samples).toHaveLength(samples.length);
    });
  });

  describe('outlier removal', () => {
    it('removes a single high outlier', () => {
      const samples = [10, 11, 12, 10, 11, 12, 11, 1000];
      const result = trimOutliers(samples);
      expect(result.samples).not.toContain(1000);
      expect(result.trimmedCount).toBe(1);
    });

    it('removes a single low outlier', () => {
      const samples = [100, 102, 101, 103, 100, 101, 1];
      const result = trimOutliers(samples);
      expect(result.samples).not.toContain(1);
      expect(result.trimmedCount).toBe(1);
    });

    it('removes multiple outliers on both ends', () => {
      const samples = [1, 100, 101, 102, 100, 101, 103, 9999];
      const result = trimOutliers(samples);
      expect(result.samples).not.toContain(1);
      expect(result.samples).not.toContain(9999);
      expect(result.trimmedCount).toBe(2);
    });

    it('preserves non-outlier values exactly', () => {
      const core = [100, 105, 95, 102, 98, 101];
      const samples = [...core, 5000];
      const result = trimOutliers(samples);
      for (const v of core) {
        expect(result.samples).toContain(v);
      }
    });
  });

  describe('realistic benchmark scenario (n=15)', () => {
    it('removes 0-3 outliers from a 15-sample benchmark run', () => {
      // Simulates 15 independent browser-load sessions with 1-2 JIT/GC spikes
      const normal = [320, 330, 315, 325, 318, 322, 328, 316, 319, 324, 321, 323, 317];
      const withSpikes = [...normal, 900, 850]; // two cold-start spikes
      const result = trimOutliers(withSpikes);
      expect(result.trimmedCount).toBeGreaterThanOrEqual(1);
      expect(result.trimmedCount).toBeLessThanOrEqual(3);
      expect(result.samples.length).toBeGreaterThanOrEqual(12);
    });

    it('does not over-trim a low-variance run', () => {
      const stable = [300, 302, 298, 301, 299, 303, 300, 301, 302, 298, 300, 301, 299, 302, 300];
      const result = trimOutliers(stable);
      expect(result.trimmedCount).toBe(0);
      expect(result.samples).toHaveLength(stable.length);
    });
  });

  describe('input ordering', () => {
    it('produces the same trimmedCount regardless of input order', () => {
      const ordered = [10, 11, 12, 13, 14, 15, 1000];
      const shuffled = [1000, 13, 10, 15, 12, 11, 14];
      const r1 = trimOutliers(ordered);
      const r2 = trimOutliers(shuffled);
      expect(r1.trimmedCount).toBe(r2.trimmedCount);
      expect(r1.samples.sort((a, b) => a - b)).toEqual(
        r2.samples.sort((a, b) => a - b),
      );
    });

    it('does not mutate the input array', () => {
      const samples = [10, 11, 1000, 12, 13];
      const copy = [...samples];
      trimOutliers(samples);
      expect(samples).toEqual(copy);
    });
  });
});
