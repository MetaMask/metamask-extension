import { TextColor } from '../../../../helpers/constants/design-system';
import {
  determineBalanceColor,
  formatPercentageChange,
  formatAmountChange,
} from './get-display-balance';

describe('determineBalanceColor', () => {
  it('returns textAlternative in privacy mode regardless of value', () => {
    [100, -100, 0].forEach((v) =>
      expect(determineBalanceColor(v, true)).toBe(TextColor.textAlternative),
    );
  });

  it('returns successDefault for positive values', () => {
    [0.01, 100, 999999].forEach((v) =>
      expect(determineBalanceColor(v, false)).toBe(TextColor.successDefault),
    );
  });

  it('returns errorDefault for negative values', () => {
    [-0.01, -100, -999999].forEach((v) =>
      expect(determineBalanceColor(v, false)).toBe(TextColor.errorDefault),
    );
  });

  it('returns textDefault for zero or undefined', () => {
    [0, undefined].forEach((v) =>
      expect(determineBalanceColor(v, false)).toBe(TextColor.textDefault),
    );
  });
});

describe('formatPercentageChange', () => {
  it('formats positive percentages with plus sign', () => {
    expect(formatPercentageChange(5.25, 'en-US')).toBe('(+5.25%)');
    expect(formatPercentageChange(10, 'en-US')).toBe('(+10.00%)');
    expect(formatPercentageChange(0.5, 'en-US')).toBe('(+0.50%)');
  });

  it('formats negative percentages with minus sign', () => {
    expect(formatPercentageChange(-5.25, 'en-US')).toBe('(-5.25%)');
    expect(formatPercentageChange(-10, 'en-US')).toBe('(-10.00%)');
    expect(formatPercentageChange(-0.5, 'en-US')).toBe('(-0.50%)');
  });

  it('shows minimum 0.01% for very small positive changes', () => {
    expect(formatPercentageChange(0.009, 'en-US')).toBe('(+0.01%)');
    expect(formatPercentageChange(0.001, 'en-US')).toBe('(+0.01%)');
    expect(formatPercentageChange(0.0001, 'en-US')).toBe('(+0.01%)');
  });

  it('shows minimum 0.01% for very small negative changes', () => {
    expect(formatPercentageChange(-0.009, 'en-US')).toBe('(-0.01%)');
    expect(formatPercentageChange(-0.001, 'en-US')).toBe('(-0.01%)');
    expect(formatPercentageChange(-0.0001, 'en-US')).toBe('(-0.01%)');
  });

  it('does not apply minimum to values >= 0.01', () => {
    expect(formatPercentageChange(0.01, 'en-US')).toBe('(+0.01%)');
    expect(formatPercentageChange(0.02, 'en-US')).toBe('(+0.02%)');
  });

  it('formats zero or undefined as +0.00%', () => {
    expect(formatPercentageChange(0, 'en-US')).toBe('(+0.00%)');
    expect(formatPercentageChange(undefined, 'en-US')).toBe('(+0.00%)');
  });

  it('handles very large percentages', () => {
    expect(formatPercentageChange(1000, 'en-US')).toBe('(+1,000.00%)');
    expect(formatPercentageChange(-1000, 'en-US')).toBe('(-1,000.00%)');
  });

  it('handles decimal precision', () => {
    expect(formatPercentageChange(1.234567, 'en-US')).toBe('(+1.23%)');
    expect(formatPercentageChange(1.236, 'en-US')).toBe('(+1.24%)');
  });
});

describe('formatAmountChange', () => {
  it('formats positive amounts with plus sign and currency', () => {
    expect(formatAmountChange(100.5, 'USD', 'en-US')).toBe('+$100.50');
    expect(formatAmountChange(1000, 'USD', 'en-US')).toBe('+$1,000.00');
    expect(formatAmountChange(0.01, 'USD', 'en-US')).toBe('+$0.01');
  });

  it('formats negative amounts with minus sign and currency', () => {
    expect(formatAmountChange(-100.5, 'USD', 'en-US')).toBe('-$100.50');
    expect(formatAmountChange(-1000, 'USD', 'en-US')).toBe('-$1,000.00');
    expect(formatAmountChange(-0.01, 'USD', 'en-US')).toBe('-$0.01');
  });

  it('formats zero with plus sign', () => {
    expect(formatAmountChange(0, 'USD', 'en-US')).toBe('+$0.00');
  });

  it('works with different currencies', () => {
    expect(formatAmountChange(100, 'EUR', 'en-US')).toBe('+€100.00');
    expect(formatAmountChange(100, 'GBP', 'en-US')).toBe('+£100.00');
    expect(formatAmountChange(100, 'JPY', 'en-US')).toBe('+¥100.00');
  });

  it('returns empty string for invalid amounts', () => {
    [undefined, NaN, Infinity, -Infinity].forEach((v) =>
      expect(formatAmountChange(v, 'USD', 'en-US')).toBe(''),
    );
  });

  it('falls back to decimal formatting when currency is invalid', () => {
    const result = formatAmountChange(100.5, 'INVALID', 'en-US');
    expect(result).toBe('+100.50');
  });

  it('handles fallback with negative numbers', () => {
    const result = formatAmountChange(-100.5, 'INVALID', 'en-US');
    expect(result).toBe('-100.50');
  });

  it('always shows 2 decimal places', () => {
    expect(formatAmountChange(100, 'USD', 'en-US')).toBe('+$100.00');
    expect(formatAmountChange(100.1, 'USD', 'en-US')).toBe('+$100.10');
  });

  it('handles very large numbers', () => {
    expect(formatAmountChange(1000000.99, 'USD', 'en-US')).toBe(
      '+$1,000,000.99',
    );
  });

  it('handles very small numbers with rounding', () => {
    expect(formatAmountChange(0.001, 'USD', 'en-US')).toBe('+$0.00');
    expect(formatAmountChange(0.009, 'USD', 'en-US')).toBe('+$0.01');
  });
});
