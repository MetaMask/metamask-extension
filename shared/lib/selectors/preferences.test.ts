import {
  getTdpChartType,
  getTdpChartInterval,
  getTdpChartIndicators,
} from './preferences';

describe('TDP Chart Preferences Selectors', () => {
  describe('getTdpChartType', () => {
    it('returns the persisted chart type when available', () => {
      const state = {
        metamask: {
          preferences: {
            tdpChartType: 1,
          },
        },
      };

      expect(getTdpChartType(state)).toBe(1);
    });

    it('returns default line chart (2) when not set', () => {
      const state = {
        metamask: {
          preferences: {},
        },
      };

      expect(getTdpChartType(state)).toBe(2);
    });

    it('returns default when preferences is undefined', () => {
      const state = {
        metamask: {},
      };

      expect(getTdpChartType(state)).toBe(2);
    });
  });

  describe('getTdpChartInterval', () => {
    it('returns the persisted interval when available', () => {
      const state = {
        metamask: {
          preferences: {
            tdpChartInterval: '1h',
          },
        },
      };

      expect(getTdpChartInterval(state)).toBe('1h');
    });

    it('returns default 15m when not set', () => {
      const state = {
        metamask: {
          preferences: {},
        },
      };

      expect(getTdpChartInterval(state)).toBe('15m');
    });

    it('returns default when preferences is undefined', () => {
      const state = {
        metamask: {},
      };

      expect(getTdpChartInterval(state)).toBe('15m');
    });
  });

  describe('getTdpChartIndicators', () => {
    it('returns the persisted indicators when available', () => {
      const state = {
        metamask: {
          preferences: {
            tdpChartIndicators: ['RSI', 'MACD'],
          },
        },
      };

      expect(getTdpChartIndicators(state)).toStrictEqual(['RSI', 'MACD']);
    });

    it('returns empty array when not set', () => {
      const state = {
        metamask: {
          preferences: {},
        },
      };

      expect(getTdpChartIndicators(state)).toStrictEqual([]);
    });

    it('returns empty array when preferences is undefined', () => {
      const state = {
        metamask: {},
      };

      expect(getTdpChartIndicators(state)).toStrictEqual([]);
    });

    it('returns the same empty array reference on multiple calls', () => {
      const state = {
        metamask: {
          preferences: {},
        },
      };

      const result1 = getTdpChartIndicators(state);
      const result2 = getTdpChartIndicators(state);

      // Same reference prevents unnecessary re-renders
      expect(result1).toBe(result2);
    });
  });
});
