import { BigNumber } from 'bignumber.js';
import { calcTokenAmount } from '../../../../../shared/lib/transactions-controller-utils';

type FormatOptions = {
  decimalPlaces?: number;
  shouldEllipse?: boolean;
};
const defaultFormatOptions = {
  decimalPlaces: 4,
};

/**
 * Calculates the number of leading zeros in the fractional part of a number.
 *
 * This function converts a number or a string representation of a number into
 * its decimal form and then counts the number of leading zeros present in the
 * fractional part of the number. This is useful for determining the precision
 * of very small numbers.
 *
 * @param num - The number to analyze, which can be in the form
 * of a number or a string.
 * @returns The count of leading zeros in the fractional part of the number.
 */
export const getLeadingZeroCount = (num: number | string) => {
  const numToString = new BigNumber(num, 10).toString(10);
  const fractionalPart = numToString.split('.')[1] ?? '';
  return fractionalPart.match(/^0*/u)?.[0]?.length || 0;
};

/**
 * This formats a number using Intl
 * It abbreviates large numbers (using K, M, B, T)
 * And abbreviates small numbers in 2 ways:
 * - Will format to the given number of decimal places
 * - Will format up to 4 decimal places
 * - Will ellipse the number if longer than given decimal places
 *
 * @param numericAmount - The number to format
 * @param opts - The options to use when formatting
 * @returns The formatted number
 */
export const formatAmount = (numericAmount: number, opts?: FormatOptions) => {
  // create options with defaults
  const options = { ...defaultFormatOptions, ...opts };

  const leadingZeros = getLeadingZeroCount(numericAmount);
  const isDecimal = numericAmount.toString().includes('.') || leadingZeros > 0;
  const isLargeNumber = numericAmount > 999;

  const handleShouldEllipse = (decimalPlaces: number) =>
    Boolean(options?.shouldEllipse) && leadingZeros >= decimalPlaces;

  if (isLargeNumber) {
    return Intl.NumberFormat('en-US', {
      notation: 'compact',
      compactDisplay: 'short',
      maximumFractionDigits: 2,
    }).format(numericAmount);
  }

  if (isDecimal) {
    const ellipse = handleShouldEllipse(options.decimalPlaces);
    const formattedValue = Intl.NumberFormat('en-US', {
      minimumFractionDigits: ellipse ? options.decimalPlaces : undefined,
      maximumFractionDigits: options.decimalPlaces,
    }).format(numericAmount);

    return ellipse ? `${formattedValue}...` : formattedValue;
  }

  // Default to showing the raw amount
  return numericAmount.toString();
};

export const getAmount = (
  amount: string,
  decimals: string,
  options?: FormatOptions,
) => {
  if (!amount || !decimals) {
    return '';
  }

  const numericAmount = calcTokenAmount(
    amount,
    parseFloat(decimals),
  ).toNumber();

  return formatAmount(numericAmount, options);
};
