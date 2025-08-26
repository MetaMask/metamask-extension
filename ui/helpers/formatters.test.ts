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

describe('formatCurrencyWithMinThreshold', () => {
  const testCases = [
    { value: 0.000001, expected: '<$0.01' },
    { value: 0.001, expected: '<$0.01' },
    { value: 0.01, expected: '$0.01' },
    { value: 0.1, expected: '$0.10' },
    { value: 0, expected: '$0.00' },
    { value: 1, expected: '$1.00' },
    { value: 1_000, expected: '$1,000.00' },
    { value: 1_000_000, expected: '$1,000,000.00' },
  ];

  it('formats values correctly', () => {
    const { formatCurrencyWithMinThreshold } = createFormatters({ locale });
    testCases.forEach(({ value, expected }) => {
      expect(formatCurrencyWithMinThreshold(value, 'USD')).toBe(expected);
    });
  });

  it('handles invalid values', () => {
    const { formatCurrencyWithMinThreshold } = createFormatters({ locale });
    [Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY].forEach(
      (input) => {
        expect(formatCurrencyWithMinThreshold(input, 'USD')).toBe('');
      },
    );
  });
});

describe('locale variations', () => {
  describe('en-GB GBP', () => {
    it('formats standard value', () => {
      const { formatCurrency } = createFormatters({ locale: 'en-GB' });
      expect(formatCurrency(1234.56, 'GBP')).toBe('£1,234.56');
    });

    it('min threshold logic', () => {
      const { formatCurrencyWithMinThreshold } = createFormatters({
        locale: 'en-GB',
      });
      expect(formatCurrencyWithMinThreshold(0.005, 'GBP')).toBe('<£0.01');
      expect(formatCurrencyWithMinThreshold(1_000, 'GBP')).toBe('£1,000.00');
    });
  });
});
