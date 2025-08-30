import { createFormatters } from './formatters';

const locale = 'en-US';

describe('formatCurrency', () => {
  it('formats values with currency code', () => {
    const { formatCurrency } = createFormatters({ locale });
    expect(formatCurrency(1234.56, 'USD')).toBe('$1,234.56');
  });

  it('handles zero', () => {
    const { formatCurrency } = createFormatters({ locale });
    expect(formatCurrency(0, 'USD')).toBe('$0.00');
  });

  it('handles negative values', () => {
    const { formatCurrency } = createFormatters({ locale });
    expect(formatCurrency(-42.5, 'USD')).toBe('-$42.50');
  });

  it('handles invalid values', () => {
    const { formatCurrency } = createFormatters({ locale });
    for (const input of [
      Number.NaN,
      Number.POSITIVE_INFINITY,
      Number.NEGATIVE_INFINITY,
    ]) {
      expect(formatCurrency(input, 'USD')).toBe('');
    }
  });
});

describe('formatCurrencyWithThreshold', () => {
  it('returns 0 for zero value', () => {
    const { formatCurrencyWithThreshold } = createFormatters({ locale });
    expect(formatCurrencyWithThreshold(0, 'USD')).toBe('$0.00');
  });

  it('returns <0.001 for values less than 0.001', () => {
    const { formatCurrencyWithThreshold } = createFormatters({ locale });
    expect(formatCurrencyWithThreshold(0.0000001, 'USD')).toBe('<$0.001');
  });

  it('returns <0.01 for values between 0.01 and 0.001', () => {
    const { formatCurrencyWithThreshold } = createFormatters({ locale });
    expect(formatCurrencyWithThreshold(0.00789, 'USD')).toBe('<$0.01');
  });

  it('uses three decimals for values between 1 and 0.01', () => {
    const { formatCurrencyWithThreshold } = createFormatters({ locale });
    expect(formatCurrencyWithThreshold(0.01234, 'USD')).toBe('$0.012');
  });

  it('uses two decimals for values < 1 million', () => {
    const { formatCurrencyWithThreshold } = createFormatters({ locale });
    expect(formatCurrencyWithThreshold(1234.567, 'USD')).toBe('$1,234.57');
  });

  it('uses compact notation for values >= 1 million', () => {
    const { formatCurrencyWithThreshold } = createFormatters({ locale });
    expect(formatCurrencyWithThreshold(5_000_000, 'USD')).toBe('$5.00M');
  });
});

describe('locale variations', () => {
  describe('en-GB GBP', () => {
    it('formats standard value', () => {
      const { formatCurrency } = createFormatters({ locale: 'en-GB' });
      expect(formatCurrency(1234.56, 'GBP')).toBe('£1,234.56');
    });
    it('threshold logic', () => {
      const { formatCurrencyWithThreshold } = createFormatters({
        locale: 'en-GB',
      });
      expect(formatCurrencyWithThreshold(0.0000005, 'GBP')).toBe('<£0.001');
    });
    it('compact large', () => {
      const { formatCurrencyWithThreshold } = createFormatters({
        locale: 'en-GB',
      });
      expect(formatCurrencyWithThreshold(12_300_000, 'GBP')).toBe('£12.30M');
    });
  });
});

describe('formatCurrencyCompact', () => {
  it('formats a mid-sized value with compact notation', () => {
    const { formatCurrencyCompact } = createFormatters({ locale });
    expect(formatCurrencyCompact(12_345, 'USD')).toBe('$12.35K');
  });

  it('formats a large value with compact notation', () => {
    const { formatCurrencyCompact } = createFormatters({ locale });
    expect(formatCurrencyCompact(9_876_543, 'USD')).toBe('$9.88M');
  });

  it('handles small values', () => {
    const { formatCurrencyCompact } = createFormatters({ locale });
    expect(formatCurrencyCompact(12.3, 'USD')).toBe('$12.30');
  });
});
