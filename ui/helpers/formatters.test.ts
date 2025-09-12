import { createFormatters } from './formatters';

const locale = 'en-US';

const invalidValues = [
  Number.NaN,
  Number.POSITIVE_INFINITY,
  Number.NEGATIVE_INFINITY,
];

describe('formatCurrency', () => {
  const { formatCurrency } = createFormatters({ locale });

  const testCases = [
    { value: 1_234.56, expected: '$1,234.56' },
    { value: 0, expected: '$0.00' },
    { value: -42.5, expected: '-$42.50' },
  ];

  it('formats values correctly', () => {
    testCases.forEach(({ value, expected }) => {
      expect(formatCurrency(value, 'USD')).toBe(expected);
    });
  });

  it('handles invalid values', () => {
    invalidValues.forEach((input) => {
      expect(formatCurrency(input, 'USD')).toBe('');
    });
  });

  it('formats values correctly with different locale', () => {
    const { formatCurrency: formatCurrencyGB } = createFormatters({
      locale: 'en-GB',
    });
    expect(formatCurrencyGB(1234.56, 'GBP')).toBe('£1,234.56');
  });
});

describe('formatCurrencyWithMinThreshold', () => {
  const { formatCurrencyWithMinThreshold } = createFormatters({ locale });

  const testCases = [
    { value: 0, expected: '$0.00' },

    // Values below minimum threshold
    { value: 0.000001, expected: '<$0.01' },
    { value: 0.001, expected: '<$0.01' },

    // Values at and above minimum threshold
    { value: 0.01, expected: '$0.01' },
    { value: 0.1, expected: '$0.10' },
    { value: 1, expected: '$1.00' },
    { value: 1_000, expected: '$1,000.00' },
    { value: 1_000_000, expected: '$1,000,000.00' },
  ];

  it('formats values correctly', () => {
    testCases.forEach(({ value, expected }) => {
      expect(formatCurrencyWithMinThreshold(value, 'USD')).toBe(expected);
    });
  });

  it('handles invalid values', () => {
    invalidValues.forEach((input) => {
      expect(formatCurrencyWithMinThreshold(input, 'USD')).toBe('');
    });
  });
});

describe('formatCurrencyTokenPrice', () => {
  const { formatCurrencyTokenPrice } = createFormatters({ locale });

  const testCases = [
    { value: 0, expected: '$0.00' },

    // Values below minimum threshold
    { value: 0.000000001, expected: '<$0.00000001' },

    // Values above minimum threshold but less than 1
    { value: 0.0000123, expected: '$0.0000123' },
    { value: 0.001, expected: '$0.00100' },
    { value: 0.999, expected: '$0.999' },

    // Values at and above 1 but less than 1,000,000
    { value: 1, expected: '$1.00' },

    // Values 1,000,000 and above
    { value: 1_000_000, expected: '$1.00M' },
  ];

  it('formats values correctly', () => {
    testCases.forEach(({ value, expected }) => {
      expect(formatCurrencyTokenPrice(value, 'USD')).toBe(expected);
    });
  });

  it('handles invalid values', () => {
    invalidValues.forEach((input) => {
      expect(formatCurrencyTokenPrice(input, 'USD')).toBe('');
    });
  });
});

describe('formatToken', () => {
  const { formatToken } = createFormatters({ locale });

  const testCases = [
    { value: 1.234, symbol: 'ETH', expected: '1.234 ETH' },
    { value: 0, symbol: 'USDC', expected: '0 USDC' },
    { value: 1_000, symbol: 'DAI', expected: '1,000 DAI' },
  ];

  it('formats token values', () => {
    testCases.forEach(({ value, symbol, expected }) => {
      expect(formatToken(value, symbol)).toBe(expected);
    });
  });

  it('handles invalid values', () => {
    invalidValues.forEach((input) => {
      expect(formatToken(input, 'ETH')).toBe('');
    });
  });
});

describe('formatTokenQuantity', () => {
  const { formatTokenQuantity } = createFormatters({ locale });

  const testCases = [
    { value: 0, symbol: 'ETH', expected: '0 ETH' },

    // Values below minimum threshold
    { value: 0.000000001, symbol: 'ETH', expected: '<0.00001 ETH' },
    { value: 0.0000005, symbol: 'USDC', expected: '<0.00001 USDC' },

    // Values above minimum threshold but less than 1
    { value: 0.00001, symbol: 'ETH', expected: '0.0000100 ETH' },
    { value: 0.001234, symbol: 'BTC', expected: '0.00123 BTC' },
    { value: 0.123456, symbol: 'USDC', expected: '0.123 USDC' },

    // Values 1 and above but less than 1,000,000
    { value: 1, symbol: 'ETH', expected: '1 ETH' },
    { value: 1.2345678, symbol: 'BTC', expected: '1.235 BTC' },
    { value: 123.45678, symbol: 'USDC', expected: '123.457 USDC' },
    { value: 999_999, symbol: 'DAI', expected: '999,999 DAI' },

    // Values 1,000,000 and above
    { value: 1_000_000, symbol: 'ETH', expected: '1.00M ETH' },
    { value: 1_234_567, symbol: 'BTC', expected: '1.23M BTC' },
    { value: 1_000_000_000, symbol: 'USDC', expected: '1.00B USDC' },
  ];

  it('formats token quantities correctly', () => {
    testCases.forEach(({ value, symbol, expected }) => {
      expect(formatTokenQuantity(value, symbol)).toBe(expected);
    });
  });

  it('handles invalid values', () => {
    invalidValues.forEach((input) => {
      expect(formatTokenQuantity(input, 'ETH')).toBe('');
    });
  });
});
