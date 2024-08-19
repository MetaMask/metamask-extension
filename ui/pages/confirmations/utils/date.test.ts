import { formatDate } from './date';

describe('date util', () => {
  describe('formatDate', () => {
    it('formats passed date string', () => {
      expect(formatDate('2021-09-30T16:25:24.000Z')).toEqual(
        '30 September 2021, 16:25',
      );
    });

    it('returns empty string if empty string is passed', () => {
      expect(formatDate('')).toEqual('');
    });
  });
});
