import type { DappPageLoadSample } from '../../utils/types';
import {
  aggregateDappPageLoadStatistics,
  dappPageLoadStatsToBenchmarkResults,
} from './dapp-page-load-stats';

describe('dapp-page-load-stats', () => {
  describe('aggregateDappPageLoadStatistics', () => {
    it('groups by page and produces timers with ids matching metric keys', () => {
      const samples: DappPageLoadSample[] = [
        {
          page: 'https://example.test/',
          run: 0,
          timestamp: 1,
          metrics: {
            pageLoadTime: 100,
            domContentLoaded: 40,
            firstPaint: 10,
            firstContentfulPaint: 20,
            largestContentfulPaint: 50,
          },
        },
        {
          page: 'https://example.test/',
          run: 1,
          timestamp: 2,
          metrics: {
            pageLoadTime: 120,
            domContentLoaded: 45,
            firstPaint: 12,
            firstContentfulPaint: 22,
            largestContentfulPaint: 55,
          },
        },
      ];

      const stats = aggregateDappPageLoadStatistics(samples);

      expect(stats).toHaveLength(1);
      expect(stats[0].page).toBe('https://example.test/');
      const ids = stats[0].timers.map((t) => t.id).sort();
      expect(ids).toEqual([
        'domContentLoaded',
        'firstContentfulPaint',
        'firstPaint',
        'largestContentfulPaint',
        'pageLoadTime',
      ]);
      const plt = stats[0].timers.find((t) => t.id === 'pageLoadTime');
      expect(plt?.samples).toBe(2);
      expect(plt?.mean).toBeGreaterThan(0);
    });
  });

  describe('dappPageLoadStatsToBenchmarkResults', () => {
    it('writes BenchmarkResults under dappPageLoad', () => {
      const samples: DappPageLoadSample[] = [
        {
          page: 'p',
          run: 0,
          timestamp: 1,
          metrics: {
            pageLoadTime: 100,
            domContentLoaded: 40,
            firstPaint: 10,
            firstContentfulPaint: 20,
            largestContentfulPaint: 50,
          },
        },
      ];
      const stats = aggregateDappPageLoadStatistics(samples);
      const out = dappPageLoadStatsToBenchmarkResults(stats);

      expect(out.dappPageLoad).toBeDefined();
      expect(out.dappPageLoad.testTitle).toBe('dappPageLoad');
      expect(out.dappPageLoad.mean.pageLoadTime).toBeGreaterThan(0);
    });
  });
});
