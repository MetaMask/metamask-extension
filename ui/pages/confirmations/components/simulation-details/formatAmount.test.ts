import { BigNumber } from 'bignumber.js';
import { formatAmount } from './formatAmount';

describe('formatAmount', () => {
  describe('#formatAmount', () => {
    const locale = 'en-US';

    it('returns "0" for zero amount', () => {
      expect(formatAmount(locale, new BigNumber(0))).toBe('0');
    });

    it('returns "<0.000001" for 0 < amount < MIN_AMOUNT', () => {
      expect(formatAmount(locale, new BigNumber(0.0000009))).toBe('<0.000001');
    });

    // @ts-expect-error This is missing from the Mocha type definitions
    it.each([
      [0.0000456, '0.000046'],
      [0.0004567, '0.000457'],
      [0.003456, '0.00346'],
      [0.023456, '0.0235'],
      [0.125456, '0.125'],
    ])(
      'formats amount less than 1 with maximum significant digits (%s => %s)',
      (amount: number, expected: string) => {
        expect(formatAmount(locale, new BigNumber(amount))).toBe(expected);
      },
    );

    // @ts-expect-error This is missing from the Mocha type definitions
    it.each([
      [1.0034, '1.003'],
      [1.034, '1.034'],
      [1.3034, '1.303'],
      [12.0345, '12.03'],
      [121.456, '121.5'],
      [1034.123, '1,034'],
      [47361034.006, '47,361,034'],
      ['12130982923409.5', '12,130,982,923,410'],
      ['1213098292340944.5', '1,213,098,292,340,945'],
      ['30001231231212312138768', '30,001,231,231,212,312,138,768'],
      [
        '1157920892373161954235709850086879078532699846656405640394575.84007913129639935',
        '1,157,920,892,373,161,954,235,709,850,086,879,078,532,699,846,656,405,640,394,576',
      ],
    ])(
      'formats amount greater than or equal to 1 with appropriate decimal precision (%s => %s)',
      (amount: number, expected: string) => {
        expect(formatAmount(locale, new BigNumber(amount))).toBe(expected);
      },
    );
  });

  describe('#formatAmount with ROUND_DOWN', () => {
    const locale = 'en-US';
    const roundDown = BigNumber.ROUND_DOWN;

    it('returns "0" for zero amount regardless of rounding mode', () => {
      expect(formatAmount(locale, new BigNumber(0), roundDown)).toBe('0');
    });

    it('returns "<0.000001" for amounts below MIN_AMOUNT regardless of rounding mode', () => {
      expect(formatAmount(locale, new BigNumber(0.0000009), roundDown)).toBe(
        '<0.000001',
      );
    });

    // @ts-expect-error This is missing from the Mocha type definitions
    it.each([
      // Already at 3 sig figs — no rounding occurs
      [0.0000456, '0.0000456'],
      // 4th sig fig (7) would round up; ROUND_DOWN truncates to 0.000456
      [0.0004567, '0.000456'],
      // 4th sig fig (6) would round up; ROUND_DOWN truncates to 0.00345
      [0.003456, '0.00345'],
      // 4th sig fig (5) would round up; ROUND_DOWN truncates to 0.0234
      [0.023456, '0.0234'],
      // 4th sig fig (4) would not round up anyway; same result
      [0.125456, '0.125'],
    ])(
      'truncates amount less than 1 toward zero (%s => %s)',
      (amount: number, expected: string) => {
        expect(formatAmount(locale, new BigNumber(amount), roundDown)).toBe(
          expected,
        );
      },
    );

    // @ts-expect-error This is missing from the Mocha type definitions
    it.each([
      // 1 integer digit → maxFrac = 3; 4th decimal (4) would not round up anyway
      [1.0034, '1.003'],
      // 1 integer digit → maxFrac = 3; truncates rather than rounds up
      [1.3034, '1.303'],
      // 2 integer digits → maxFrac = 2; 3rd decimal (5) would round up; ROUND_DOWN gives 12.03
      [12.0345, '12.03'],
      // 3 integer digits → maxFrac = 1; 2nd decimal (5) would round up; ROUND_DOWN gives 121.4
      [121.456, '121.4'],
      // 4 integer digits → maxFrac = 0; result is whole number
      [1034.123, '1,034'],
    ])(
      'truncates amount greater than or equal to 1 toward zero (%s => %s)',
      (amount: number, expected: string) => {
        expect(formatAmount(locale, new BigNumber(amount), roundDown)).toBe(
          expected,
        );
      },
    );
  });
});
