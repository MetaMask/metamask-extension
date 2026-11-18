import BigNumber from 'bignumber.js';
import {
  formatCompactConfirmationUsd,
  formatConfirmationUsd,
} from './format-confirmation-usd';

describe('formatConfirmationUsd', () => {
  it('formats USD amounts with "$" and en-US separators', () => {
    expect(formatConfirmationUsd(0)).toBe('$0.00');
    expect(formatConfirmationUsd(100)).toBe('$100.00');
    expect(formatConfirmationUsd(1234.5)).toBe('$1,234.50');
  });
});

describe('formatCompactConfirmationUsd', () => {
  it('omits trailing .00 for whole dollar amounts', () => {
    expect(formatCompactConfirmationUsd(new BigNumber('100'))).toBe('$100');
    expect(formatCompactConfirmationUsd(new BigNumber('100.00'))).toBe('$100');
    expect(formatCompactConfirmationUsd(new BigNumber('1000'))).toBe('$1,000');
  });

  it('keeps two decimal places when cents are non-zero', () => {
    expect(formatCompactConfirmationUsd(new BigNumber('106.2'))).toBe(
      '$106.20',
    );
    expect(formatCompactConfirmationUsd(new BigNumber('99.95'))).toBe('$99.95');
  });

  it('collapses sub-cent dust to $0', () => {
    expect(formatCompactConfirmationUsd(new BigNumber('0.004'))).toBe('$0');
  });

  it('returns empty string for non-finite values', () => {
    expect(formatCompactConfirmationUsd(new BigNumber(NaN))).toBe('');
  });
});
