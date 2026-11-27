import { runPageLoadBenchmark } from './runner';
import type { MeasurePageResult, Metrics } from './types';

const buildMetrics = (overrides: Partial<Metrics> = {}): Metrics => ({
  navigation: [
    { load: 100, domContentLoaded: 80, domInteractive: 60, type: 'navigate' },
  ],
  paint: { 'first-paint': 50 },
  'UI Startup': 10,
  'Background Connect': 11,
  'First Render': 12,
  'Initial Actions': 13,
  'Load Scripts': 14,
  'Setup Store': 15,
  numNetworkReqs: 3,
  ...overrides,
});

const runWith = async (metrics: Metrics[]) => {
  const measurePage = async (): Promise<MeasurePageResult> => ({
    metrics,
    title: 'home',
    persona: 'standard' as MeasurePageResult['persona'],
  });
  // Two browser loads: the first is discarded as warm-up.
  return runPageLoadBenchmark(measurePage, {
    browserLoads: 2,
    pageLoads: metrics.length,
  });
};

const LONG_TASK_KEYS = [
  'longTaskCount',
  'longTaskTotalDuration',
  'longTaskMaxDuration',
  'tbt',
];

describe('runPageLoadBenchmark', () => {
  describe('long-task metrics absent from every sample', () => {
    it('omits them from every statistic instead of reporting NaN', async () => {
      const results = await runWith([buildMetrics(), buildMetrics()]);

      for (const stat of [
        results.mean,
        results.min,
        results.max,
        results.stdDev,
        results.p75,
        results.p95,
        results.trimmedCount,
        results.outliers,
      ]) {
        for (const key of LONG_TASK_KEYS) {
          expect(stat).not.toHaveProperty(key);
        }
      }
      expect(Object.values(results.mean).some(Number.isNaN)).toBe(false);
    });

    it('keeps the other metrics', async () => {
      const results = await runWith([buildMetrics(), buildMetrics()]);

      expect(results.mean.uiStartup).toBe(10);
      expect(results.mean.numNetworkReqs).toBe(3);
    });
  });

  describe('long-task metrics present', () => {
    it('reports zero as a measured value, not as absent', async () => {
      const results = await runWith([
        buildMetrics({
          longTaskCount: 0,
          longTaskTotalDuration: 0,
          longTaskMaxDuration: 0,
          tbt: 0,
        }),
        buildMetrics({
          longTaskCount: 0,
          longTaskTotalDuration: 0,
          longTaskMaxDuration: 0,
          tbt: 0,
        }),
      ]);

      for (const key of LONG_TASK_KEYS) {
        expect(results.mean[key]).toBe(0);
        expect(results.p95[key]).toBe(0);
      }
    });

    it('reports the measured values', async () => {
      const results = await runWith([
        buildMetrics({ longTaskCount: 2, tbt: 40 }),
        buildMetrics({ longTaskCount: 4, tbt: 60 }),
      ]);

      expect(results.mean.longTaskCount).toBe(3);
      expect(results.mean.tbt).toBe(50);
    });
  });
});
