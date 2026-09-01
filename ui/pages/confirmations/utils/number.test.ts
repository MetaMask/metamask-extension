import { limitToMaximumDecimalPlaces } from './number';

describe('number util', () => {
  describe('limitToMaximumDecimalPlaces', () => {
    it('limits number to default 5 decimal places', () => {
      expect(limitToMaximumDecimalPlaces(1.123456789)).toBe('1.12346');
    });

    it('limits number to specified decimal places', () => {
      expect(limitToMaximumDecimalPlaces(1.123456789, 2)).toBe('1.12');
    });

    it('returns number as string if no decimal limiting needed', () => {
      expect(limitToMaximumDecimalPlaces(5, 2)).toBe('5');
    });

    it('handles NaN input', () => {
      expect(limitToMaximumDecimalPlaces(NaN)).toBe('NaN');
    });

    it('handles NaN maxDecimalPlaces', () => {
      expect(limitToMaximumDecimalPlaces(1.234, NaN)).toBe('1.234');
    });

    it('rounds correctly', () => {
      expect(limitToMaximumDecimalPlaces(1.999, 2)).toBe('2');
    });
  });
});
