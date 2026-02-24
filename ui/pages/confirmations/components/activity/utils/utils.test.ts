import { formatTransactionDateTime } from './utils';

describe('Activity Utils', () => {
  describe('formatTransactionDateTime', () => {
    it('formats timestamp into time and date strings', () => {
      const timestamp = new Date('2024-03-15T14:30:00').getTime();
      const result = formatTransactionDateTime(timestamp, 'en-US');

      expect(result.time).toMatch(/2:30\s*PM/iu);
      expect(result.date).toBe('Mar 15, 2024');
    });

    it('uses default locale when not provided', () => {
      const timestamp = new Date('2024-01-01T09:00:00').getTime();
      const result = formatTransactionDateTime(timestamp);

      expect(result.time).toBeDefined();
      expect(result.date).toBeDefined();
    });
  });
});
