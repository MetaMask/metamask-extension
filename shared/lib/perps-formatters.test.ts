import {
  PRICE_RANGES_MINIMAL_VIEW,
  PRICE_RANGES_UNIVERSAL,
  PRICE_THRESHOLD,
  calculateMarginRequired,
  calculatePositionSize,
  formatFundingRate,
  formatPercentage,
  formatPerpsFiat,
  formatPerpsPrice,
  formatPnl,
  formatPositionSize,
  formatWithSignificantDigits,
} from './perps-formatters';

describe('perps-formatters', () => {
  describe('formatWithSignificantDigits', () => {
    it('returns zero with defaulted decimals when value is 0', () => {
      expect(formatWithSignificantDigits(0, 5)).toStrictEqual({
        value: 0,
        decimals: 0,
      });
    });

    it('respects minDecimals for zero value', () => {
      expect(formatWithSignificantDigits(0, 5, 3)).toStrictEqual({
        value: 0,
        decimals: 3,
      });
    });

    it('calculates decimals based on integer magnitude for values >= 1', () => {
      // 123.45 with 5 sig digits → 3 integer digits, 2 decimals
      expect(formatWithSignificantDigits(123.456, 5)).toStrictEqual({
        value: 123.46,
        decimals: 2,
      });
    });

    it('clamps decimals to zero for large integer values', () => {
      // 1234567 with 4 sig digits → decimalsNeeded is negative, clamped to 0
      const result = formatWithSignificantDigits(1234567, 4);
      expect(result.decimals).toBe(0);
      expect(result.value).toBe(1234567);
    });

    it('respects minDecimals when targetDecimals is smaller', () => {
      const result = formatWithSignificantDigits(12345, 4, 2);
      expect(result.decimals).toBe(2);
    });

    it('respects maxDecimals when targetDecimals is larger', () => {
      // 1.2 with 6 sig digits → needs 5 decimals, capped at 2
      const result = formatWithSignificantDigits(1.2, 6, undefined, 2);
      expect(result.decimals).toBe(2);
      expect(result.value).toBe(1.2);
    });

    it('uses toPrecision for values < 1', () => {
      const result = formatWithSignificantDigits(0.0012345, 3);
      expect(result.value).toBeCloseTo(0.00123, 6);
    });

    it('handles negative values', () => {
      const result = formatWithSignificantDigits(-12.345, 4);
      expect(result.value).toBe(-12.35);
    });

    it('enforces minDecimals on <1 path', () => {
      const result = formatWithSignificantDigits(0.1, 2, 4);
      expect(result.decimals).toBe(4);
    });

    it('enforces maxDecimals on <1 path', () => {
      const result = formatWithSignificantDigits(0.123456789, 8, undefined, 3);
      expect(result.decimals).toBe(3);
    });
  });

  describe('formatPerpsFiat', () => {
    it('returns fallback for NaN input', () => {
      expect(formatPerpsFiat('not a number')).toBe('$---');
    });

    it('accepts numeric input', () => {
      expect(formatPerpsFiat(100)).toBe('$100');
    });

    it('accepts string input', () => {
      expect(formatPerpsFiat('100')).toBe('$100');
    });

    it('strips .00 using fiat-style stripping by default (minimal view)', () => {
      expect(formatPerpsFiat(1250)).toBe('$1,250');
    });

    it('preserves non-zero decimals in fiat-style stripping', () => {
      expect(formatPerpsFiat(1250.1)).toBe('$1,250.10');
    });

    it('uses significantDigits when configured (universal range)', () => {
      expect(formatPerpsFiat(123456, { ranges: PRICE_RANGES_UNIVERSAL })).toBe(
        '$123,456',
      );
    });

    it('applies universal range trailing-zero stripping', () => {
      // 1500 matches > $1000 range with max 1 decimal, significant digits → trailing zero stripped
      const out = formatPerpsFiat(1500, { ranges: PRICE_RANGES_UNIVERSAL });
      expect(out).toBe('$1,500');
    });

    it('formats small values with threshold prefix', () => {
      // < $0.01 threshold fires for values < threshold
      const out = formatPerpsFiat(0.0000001, {
        ranges: PRICE_RANGES_UNIVERSAL,
      });
      expect(out.startsWith('<')).toBe(true);
    });

    it('honors stripTrailingZeros=false option', () => {
      expect(formatPerpsFiat(100, { stripTrailingZeros: false })).toBe(
        '$100.00',
      );
    });

    it('honors explicit min/max decimals overrides', () => {
      const out = formatPerpsFiat(12.3, {
        ranges: PRICE_RANGES_UNIVERSAL,
        minimumDecimals: 4,
        maximumDecimals: 4,
        stripTrailingZeros: false,
      });
      expect(out).toBe('$12.3000');
    });

    it('uses customFormat when provided on the range config', () => {
      const ranges = [
        {
          condition: () => true,
          minimumDecimals: 0,
          maximumDecimals: 0,
          customFormat: () => 'CUSTOM',
        },
      ];
      expect(formatPerpsFiat(5, { ranges })).toBe('CUSTOM');
    });

    it('falls back to 2/2 decimals when no range matches', () => {
      const ranges = [
        {
          condition: () => false,
          minimumDecimals: 0,
          maximumDecimals: 0,
        },
      ];
      expect(
        formatPerpsFiat(12.345, { ranges, stripTrailingZeros: false }),
      ).toBe('$12.35');
    });

    it('formats zero with minimal view fiat-style stripping', () => {
      expect(formatPerpsFiat(0)).toBe('$0');
    });

    it('formats zero with universal ranges (strips trailing zeros)', () => {
      expect(formatPerpsFiat(0, { ranges: PRICE_RANGES_UNIVERSAL })).toBe('$0');
    });

    it('respects non-USD currency', () => {
      const out = formatPerpsFiat(1000, { currency: 'EUR' });
      expect(out).toContain('1,000');
    });
  });

  describe('PRICE_RANGES_MINIMAL_VIEW', () => {
    it('matches large values in first range', () => {
      expect(
        PRICE_RANGES_MINIMAL_VIEW[0].condition(PRICE_THRESHOLD.LARGE),
      ).toBe(true);
    });

    it('matches any value in second range', () => {
      expect(PRICE_RANGES_MINIMAL_VIEW[1].condition(5)).toBe(true);
    });
  });

  describe('PRICE_RANGES_UNIVERSAL', () => {
    it('exposes 7 ranges', () => {
      expect(PRICE_RANGES_UNIVERSAL).toHaveLength(7);
    });

    it('matches very high value in first range', () => {
      expect(PRICE_RANGES_UNIVERSAL[0].condition(200_000)).toBe(true);
    });

    it('matches very small value only in last range', () => {
      const matching = PRICE_RANGES_UNIVERSAL.filter((r) =>
        r.condition(0.0000005),
      );
      expect(matching[0]).toBe(PRICE_RANGES_UNIVERSAL[6]);
    });
  });

  describe('formatPositionSize', () => {
    it('returns "0" for NaN', () => {
      expect(formatPositionSize('abc')).toBe('0');
    });

    it('returns "0" for exact zero', () => {
      expect(formatPositionSize(0)).toBe('0');
    });

    it('formats with szDecimals=0 without stripping integer zeros', () => {
      expect(formatPositionSize(100, 0)).toBe('100');
      expect(formatPositionSize(20, 0)).toBe('20');
    });

    it('formats with szDecimals and strips trailing zeros', () => {
      expect(formatPositionSize(44.0, 1)).toBe('44');
      expect(formatPositionSize(1.5, 2)).toBe('1.5');
    });

    it('preserves precision with szDecimals for very small values', () => {
      expect(formatPositionSize(0.00009, 5)).toBe('0.00009');
    });

    it('uses 6 decimals for abs value < 0.01', () => {
      expect(formatPositionSize(0.001234567)).toBe('0.001235');
    });

    it('uses 4 decimals for abs value < 1', () => {
      expect(formatPositionSize(0.5678)).toBe('0.5678');
    });

    it('uses 2 decimals for abs value >= 1', () => {
      expect(formatPositionSize(12.3456)).toBe('12.35');
    });

    it('strips trailing zeros when no szDecimals provided', () => {
      expect(formatPositionSize(10)).toBe('10');
    });

    it('parses string input', () => {
      expect(formatPositionSize('2.50', 2)).toBe('2.5');
    });
  });

  describe('formatPnl', () => {
    it('returns zero display for NaN', () => {
      expect(formatPnl('abc')).toBe('$0.00');
    });

    it('prefixes positive value with +', () => {
      expect(formatPnl(123.45)).toBe('+$123.45');
    });

    it('prefixes negative value with -', () => {
      expect(formatPnl(-123.45)).toBe('-$123.45');
    });

    it('treats zero as positive', () => {
      expect(formatPnl(0)).toBe('+$0.00');
    });

    it('parses string input', () => {
      expect(formatPnl('50.5')).toBe('+$50.50');
    });
  });

  describe('formatPercentage', () => {
    it('returns 0.00% for NaN', () => {
      expect(formatPercentage('abc')).toBe('0.00%');
    });

    it('prefixes positive value with +', () => {
      expect(formatPercentage(5.25)).toBe('+5.25%');
    });

    it('leaves negative value with native minus', () => {
      expect(formatPercentage(-3.1)).toBe('-3.10%');
    });

    it('defaults to 2 decimals', () => {
      expect(formatPercentage(1)).toBe('+1.00%');
    });

    it('respects custom decimals', () => {
      expect(formatPercentage(1.23456, 4)).toBe('+1.2346%');
    });

    it('accepts string input', () => {
      expect(formatPercentage('10')).toBe('+10.00%');
    });
  });

  describe('formatFundingRate', () => {
    it('returns zero display for null when showZero default', () => {
      expect(formatFundingRate(null)).toBe('0.0000%');
    });

    it('returns zero display for undefined when showZero default', () => {
      expect(formatFundingRate(undefined)).toBe('0.0000%');
    });

    it('returns empty string for null when showZero=false', () => {
      expect(formatFundingRate(null, { showZero: false })).toBe('');
    });

    it('returns zero display when value rounds to zero and showZero=true', () => {
      expect(formatFundingRate(0.00000001)).toBe('0.0000%');
    });

    it('returns formatted percentage when value rounds to zero and showZero=false', () => {
      expect(formatFundingRate(0.00000001, { showZero: false })).toBe(
        '0.0000%',
      );
    });

    it('formats non-zero rate as percentage', () => {
      expect(formatFundingRate(0.000125)).toBe('0.0125%');
    });

    it('handles negative funding rate', () => {
      expect(formatFundingRate(-0.0001)).toBe('-0.0100%');
    });
  });

  describe('formatPerpsPrice', () => {
    it('returns empty string for non-finite', () => {
      expect(formatPerpsPrice(NaN)).toBe('');
      expect(formatPerpsPrice(Infinity)).toBe('');
    });

    it('uses legacy 2-sig-digit fallback when range has no significantDigits', () => {
      const ranges = [
        {
          condition: () => true,
          minimumDecimals: 0,
          maximumDecimals: 2,
        },
      ];
      // legacy fallback caps at 2 sig digits with roundingPriority 'lessPrecision'
      expect(formatPerpsPrice(12.345, 'en-US', ranges)).toBe('$12');
    });

    it('uses legacy fallback when no range matches', () => {
      const ranges = [
        {
          condition: () => false,
          minimumDecimals: 0,
          maximumDecimals: 0,
        },
      ];
      expect(formatPerpsPrice(1.5, 'en-US', ranges)).toBe('$1.5');
    });

    it('formats with universal ranges by default', () => {
      const out = formatPerpsPrice(3245.678);
      expect(out.startsWith('$')).toBe(true);
    });
  });

  describe('calculatePositionSize', () => {
    it('throws when szDecimals is undefined', () => {
      expect(() =>
        calculatePositionSize({
          amount: '100',
          price: 10,
          szDecimals: undefined as unknown as number,
        }),
      ).toThrow('szDecimals is required');
    });

    it('throws when szDecimals is negative', () => {
      expect(() =>
        calculatePositionSize({
          amount: '100',
          price: 10,
          szDecimals: -1,
        }),
      ).toThrow('szDecimals must be >= 0');
    });

    it('returns zeroed-out size for empty amount', () => {
      expect(
        calculatePositionSize({ amount: '', price: 10, szDecimals: 2 }),
      ).toBe('0.00');
    });

    it('returns zeroed-out size when price is zero', () => {
      expect(
        calculatePositionSize({ amount: '100', price: 0, szDecimals: 3 }),
      ).toBe('0.000');
    });

    it('returns zeroed-out size when amount is NaN', () => {
      expect(
        calculatePositionSize({ amount: 'abc', price: 10, szDecimals: 2 }),
      ).toBe('0.00');
    });

    it('calculates size rounded to szDecimals', () => {
      expect(
        calculatePositionSize({ amount: '100', price: 10, szDecimals: 2 }),
      ).toBe('10.00');
    });

    it('bumps rounded size when rounding falls short of requested USD', () => {
      // 10 / 3 = 3.333... → Math.round at 2 decimals = 3.33 → 3.33 * 3 = 9.99 < 10
      // → bumps to 3.34
      const out = calculatePositionSize({
        amount: '10',
        price: 3,
        szDecimals: 2,
      });
      expect(out).toBe('3.34');
    });

    it('formats with szDecimals=0', () => {
      expect(
        calculatePositionSize({ amount: '100', price: 10, szDecimals: 0 }),
      ).toBe('10');
    });
  });

  describe('calculateMarginRequired', () => {
    it('returns 0.00 for NaN amount', () => {
      expect(calculateMarginRequired({ amount: 'abc', leverage: 5 })).toBe(
        '0.00',
      );
    });

    it('returns 0.00 for zero amount', () => {
      expect(calculateMarginRequired({ amount: '0', leverage: 5 })).toBe(
        '0.00',
      );
    });

    it('returns 0.00 for zero leverage', () => {
      expect(calculateMarginRequired({ amount: '100', leverage: 0 })).toBe(
        '0.00',
      );
    });

    it('returns 0.00 for NaN leverage', () => {
      expect(
        calculateMarginRequired({
          amount: '100',
          leverage: NaN,
        }),
      ).toBe('0.00');
    });

    it('calculates margin as amount / leverage', () => {
      expect(calculateMarginRequired({ amount: '100', leverage: 5 })).toBe(
        '20.00',
      );
    });

    it('formats to 2 decimals', () => {
      expect(calculateMarginRequired({ amount: '10', leverage: 3 })).toBe(
        '3.33',
      );
    });

    it('handles empty string amount', () => {
      expect(calculateMarginRequired({ amount: '', leverage: 5 })).toBe('0.00');
    });
  });
});
