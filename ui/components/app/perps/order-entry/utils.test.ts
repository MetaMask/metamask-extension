import type { OrderFormState } from './order-entry.types';
import {
  formatNumberForInput,
  getOrderFormPositionSize,
  isDigitsOnlyInput,
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

  describe('getOrderFormPositionSize', () => {
    const marketForm: Pick<OrderFormState, 'amount' | 'type' | 'limitPrice'> = {
      amount: '100',
      type: 'market',
      limitPrice: '',
    };

    it('sizes from the USD notional and rounds up to the size grid', () => {
      // 100 / 60,000 = 0.0016667 BTC; the controller rounds to 5 decimals.
      expect(getOrderFormPositionSize(marketForm, 60000, 5)).toBe('0.00167');
    });

    it('reads a comma-grouped amount as the full number', () => {
      expect(
        getOrderFormPositionSize({ ...marketForm, amount: '1,000' }, 60000, 5),
      ).toBe('0.01667');
    });

    it('sizes a limit order from the limit price', () => {
      expect(
        getOrderFormPositionSize(
          { amount: '100', type: 'limit', limitPrice: '$40,000' },
          60000,
          5,
        ),
      ).toBe('0.00250');
    });

    it('uses the current price while the limit price is empty', () => {
      expect(
        getOrderFormPositionSize(
          { amount: '100', type: 'limit', limitPrice: '' },
          60000,
          5,
        ),
      ).toBe('0.00167');
    });

    it('returns undefined for an empty amount', () => {
      expect(
        getOrderFormPositionSize({ ...marketForm, amount: '' }, 60000, 5),
      ).toBeUndefined();
    });

    it('returns undefined without a positive, finite price', () => {
      expect(getOrderFormPositionSize(marketForm, 0, 5)).toBeUndefined();
      expect(getOrderFormPositionSize(marketForm, Infinity, 5)).toBeUndefined();
    });
  });
});
