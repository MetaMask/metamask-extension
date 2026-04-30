import { toHumanEstimatedTimeRange } from './time';

describe('time utils', () => {
  describe('toHumanEstimatedTimeRange', () => {
    it('returns undefined when min is falsy', () => {
      expect(toHumanEstimatedTimeRange(0, 5000)).toBeUndefined();
    });

    it('returns undefined when max is falsy', () => {
      expect(toHumanEstimatedTimeRange(5000, 0)).toBeUndefined();
    });

    it('formats time range in seconds when max is less than 60 seconds', () => {
      const result = toHumanEstimatedTimeRange(15000, 30000);
      expect(result).toBe('15 - 30 sec');
    });

    it('formats time range in minutes when max is 60 seconds or more', () => {
      const result = toHumanEstimatedTimeRange(30000, 120000);
      expect(result).toBe('0.5 - 2 min');
    });
  });
});
