import { formatRampCurrencyAmount } from './formatRampCurrencyAmount';

const format = (value: number, currency: string) => `${value}:${currency}`;

describe('formatRampCurrencyAmount', () => {
  it('formats a positive amount with currency', () => {
    expect(formatRampCurrencyAmount(50, 'USD', format)).toBe('50:USD');
  });

  it('returns undefined when currency is missing', () => {
    expect(formatRampCurrencyAmount(50, undefined, format)).toBeUndefined();
  });

  it('returns undefined for non-displayable amounts', () => {
    expect(formatRampCurrencyAmount(null, 'USD', format)).toBeUndefined();
    expect(formatRampCurrencyAmount(undefined, 'USD', format)).toBeUndefined();
    expect(formatRampCurrencyAmount(0, 'USD', format)).toBeUndefined();
    expect(formatRampCurrencyAmount(NaN, 'USD', format)).toBeUndefined();
    expect(formatRampCurrencyAmount(Infinity, 'USD', format)).toBeUndefined();
  });
});
