import { isZeroAmount } from './number-utils';

describe('isZeroAmount', () => {
  describe('null and undefined values', () => {
    it('should return true for null', () => {
      expect(isZeroAmount(null)).toBe(true);
    });

    it('should return true for undefined', () => {
      expect(isZeroAmount(undefined)).toBe(true);
    });
  });

  describe('number values', () => {
    it('should return true for 0', () => {
      expect(isZeroAmount(0)).toBe(true);
    });

    it('should return true for -0', () => {
      expect(isZeroAmount(-0)).toBe(true);
    });

    it('should return false for positive numbers', () => {
      expect(isZeroAmount(1)).toBe(false);
      expect(isZeroAmount(0.1)).toBe(false);
      expect(isZeroAmount(100)).toBe(false);
    });

    it('should return false for negative numbers', () => {
      expect(isZeroAmount(-1)).toBe(false);
      expect(isZeroAmount(-0.1)).toBe(false);
      expect(isZeroAmount(-100)).toBe(false);
    });
  });

  describe('string values', () => {
    it('should return true for empty string', () => {
      expect(isZeroAmount('')).toBe(true);
    });

    it('should return true for zero strings', () => {
      expect(isZeroAmount('0')).toBe(true);
      expect(isZeroAmount('0.0')).toBe(true);
      expect(isZeroAmount('0.00')).toBe(true);
      expect(isZeroAmount('000')).toBe(true);
      expect(isZeroAmount('0.000')).toBe(true);
    });

    it('should return true for zero strings with currency symbols', () => {
      expect(isZeroAmount('$0')).toBe(true);
      expect(isZeroAmount('$0.00')).toBe(true);
      expect(isZeroAmount('€0.00')).toBe(true);
      expect(isZeroAmount('£0.00')).toBe(true);
      expect(isZeroAmount('¥0.00')).toBe(true);
      expect(isZeroAmount('₿0.00')).toBe(true);
    });

    it('should return true for zero strings with spaces and symbols', () => {
      expect(isZeroAmount(' $0.00 ')).toBe(true);
      expect(isZeroAmount('USD 0.00')).toBe(true);
      expect(isZeroAmount('0.00 USD')).toBe(true);
      expect(isZeroAmount('$ 0.00')).toBe(true);
    });

    it('should return false for non-zero strings', () => {
      expect(isZeroAmount('1')).toBe(false);
      expect(isZeroAmount('0.1')).toBe(false);
      expect(isZeroAmount('100')).toBe(false);
      expect(isZeroAmount('$1.00')).toBe(false);
      expect(isZeroAmount('$0.01')).toBe(false);
      expect(isZeroAmount('$100.00')).toBe(false);
    });

    it('should return false for strings with non-zero numbers and symbols', () => {
      expect(isZeroAmount('$1.00')).toBe(false);
      expect(isZeroAmount('€5.50')).toBe(false);
      expect(isZeroAmount('£10.25')).toBe(false);
      expect(isZeroAmount('¥100.00')).toBe(false);
      expect(isZeroAmount('₿0.001')).toBe(false);
    });

    it('should handle edge cases with special characters', () => {
      expect(isZeroAmount('0.0.0')).toBe(true); // Multiple decimal points - becomes '000' which is all zeros
      expect(isZeroAmount('0-0')).toBe(true); // Non-digit characters - becomes '00' which is all zeros
      expect(isZeroAmount('0+0')).toBe(true); // Non-digit characters - becomes '00' which is all zeros
      expect(isZeroAmount('0*0')).toBe(true); // Non-digit characters - becomes '00' which is all zeros
    });

    it('should handle strings with only non-digit characters', () => {
      expect(isZeroAmount('abc')).toBe(true); // No digits = zero
      expect(isZeroAmount('$')).toBe(true); // Only currency symbol = zero
      expect(isZeroAmount('USD')).toBe(true); // Only text = zero
    });
  });

  describe('edge cases', () => {
    it('should handle very small numbers', () => {
      expect(isZeroAmount('0.0000001')).toBe(false);
      expect(isZeroAmount('0.0000000')).toBe(true);
    });

    it('should handle scientific notation strings', () => {
      expect(isZeroAmount('0e0')).toBe(true); // Contains 'e' which is not a digit - becomes '00' which is all zeros
      expect(isZeroAmount('1e0')).toBe(false); // Contains 'e' which is not a digit - becomes '10' which is not all zeros
    });

    it('should handle strings with leading/trailing zeros', () => {
      expect(isZeroAmount('0000')).toBe(true);
      expect(isZeroAmount('00.00')).toBe(true);
      expect(isZeroAmount('000.000')).toBe(true);
    });
  });
});
