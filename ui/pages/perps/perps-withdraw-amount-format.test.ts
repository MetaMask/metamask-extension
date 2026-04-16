import {
  formatAmountInputFromNumber,
  stripInsignificantFractionZeros,
} from './perps-withdraw-amount-format';

describe('stripInsignificantFractionZeros', () => {
  it('trims trailing zeros after the decimal', () => {
    expect(stripInsignificantFractionZeros('123.450000')).toBe('123.45');
    expect(stripInsignificantFractionZeros('0.100000')).toBe('0.1');
  });

  it('removes the decimal point when the fraction is all zeros', () => {
    expect(stripInsignificantFractionZeros('123.000000')).toBe('123');
  });

  it('returns the string unchanged when there is no decimal point', () => {
    expect(stripInsignificantFractionZeros('42')).toBe('42');
  });
});

describe('formatAmountInputFromNumber', () => {
  it('returns empty string for non-positive or non-finite values', () => {
    expect(formatAmountInputFromNumber(0)).toBe('');
    expect(formatAmountInputFromNumber(-1)).toBe('');
    expect(formatAmountInputFromNumber(Number.NaN)).toBe('');
  });

  it('floors to six decimals and strips insignificant zeros', () => {
    expect(formatAmountInputFromNumber(12.3456789)).toBe('12.345678');
    expect(formatAmountInputFromNumber(100)).toBe('100');
    expect(formatAmountInputFromNumber(0.5)).toBe('0.5');
  });
});
