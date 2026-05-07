import {
  formatNumberForInput,
  isDigitsOnlyInput,
  isSignedDecimalInput,
  isUnsignedDecimalInput,
} from './utils';

describe('order-entry utils', () => {
  describe('formatNumberForInput', () => {
    it('always uses "." as decimal separator regardless of locale', () => {
      expect(formatNumberForInput(0.5)).toBe('0.5');
      expect(formatNumberForInput(1234.567)).toBe('1234.567');
    });

    it('never uses grouping separators', () => {
      expect(formatNumberForInput(1000000)).toBe('1000000');
    });

    it('respects maximumFractionDigits', () => {
      expect(formatNumberForInput(1.123456789, 2)).toBe('1.12');
    });

    it('produces output accepted by isUnsignedDecimalInput', () => {
      [0.5, 1234.567, 0.000001, 100].forEach((n) => {
        expect(isUnsignedDecimalInput(formatNumberForInput(n))).toBe(true);
      });
    });
  });
  describe('isDigitsOnlyInput', () => {
    it('accepts digit-only values', () => {
      expect(isDigitsOnlyInput('')).toBe(true);
      expect(isDigitsOnlyInput('0')).toBe(true);
      expect(isDigitsOnlyInput('123456')).toBe(true);
    });

    it('rejects non-digit values', () => {
      expect(isDigitsOnlyInput('12.3')).toBe(false);
      expect(isDigitsOnlyInput('-10')).toBe(false);
      expect(isDigitsOnlyInput('abc')).toBe(false);
    });
  });

  describe('isUnsignedDecimalInput', () => {
    it('accepts unsigned decimal typing states', () => {
      expect(isUnsignedDecimalInput('')).toBe(true);
      expect(isUnsignedDecimalInput('.')).toBe(true);
      expect(isUnsignedDecimalInput('10')).toBe(true);
      expect(isUnsignedDecimalInput('10.')).toBe(true);
      expect(isUnsignedDecimalInput('.25')).toBe(true);
      expect(isUnsignedDecimalInput('10.25')).toBe(true);
    });

    it('rejects invalid unsigned decimal values', () => {
      expect(isUnsignedDecimalInput('10..2')).toBe(false);
      expect(isUnsignedDecimalInput('1-0')).toBe(false);
      expect(isUnsignedDecimalInput('a10')).toBe(false);
    });
  });

  describe('isSignedDecimalInput', () => {
    it('accepts signed decimal typing states', () => {
      expect(isSignedDecimalInput('')).toBe(true);
      expect(isSignedDecimalInput('-')).toBe(true);
      expect(isSignedDecimalInput('-.')).toBe(true);
      expect(isSignedDecimalInput('.')).toBe(true);
      expect(isSignedDecimalInput('-12.5')).toBe(true);
      expect(isSignedDecimalInput('12.5')).toBe(true);
    });

    it('accepts + prefix and intermediate states', () => {
      expect(isSignedDecimalInput('+')).toBe(true);
      expect(isSignedDecimalInput('+.')).toBe(true);
      expect(isSignedDecimalInput('+12.5')).toBe(true);
      expect(isSignedDecimalInput('+15')).toBe(true);
    });

    it('rejects invalid signed decimal values', () => {
      expect(isSignedDecimalInput('--1')).toBe(false);
      expect(isSignedDecimalInput('-1-2')).toBe(false);
      expect(isSignedDecimalInput('1.2.3')).toBe(false);
      expect(isSignedDecimalInput('1a')).toBe(false);
      expect(isSignedDecimalInput('++1')).toBe(false);
    });
  });
});
