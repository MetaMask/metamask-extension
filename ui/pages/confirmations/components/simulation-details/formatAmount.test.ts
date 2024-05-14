import { BigNumber } from 'bignumber.js';
import { formatAmount } from './formatAmount';

describe('formatAmount', () => {
  const locale = 'en-US';

  it('returns "0" for zero amount', () => {
    expect(formatAmount(locale, new BigNumber(0))).toBe('0');
  });

  it('returns "<0.000001" for 0 < amount < MIN_AMOUNT', () => {
    expect(formatAmount(locale, new BigNumber(0.0000009))).toBe('<0.000001');
  });

  it.each([
    [0.0000456, '0.000046'],
    [0.0004567, '0.000457'],
    [0.003456, '0.00346'],
    [0.023456, '0.0235'],
    [0.125456, '0.125'],
  ])(
    'formats amount less than 1 with maximum significant digits (%s => %s)',
    (amount, expected) => {
      expect(formatAmount(locale, new BigNumber(amount))).toBe(expected);
    },
  );

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
  ])(
    'formats amount greater than or equal to 1 with appropriate decimal precision (%s => %s)',
    (amount, expected) => {
      expect(formatAmount(locale, new BigNumber(amount))).toBe(expected);
    },
  );
});
