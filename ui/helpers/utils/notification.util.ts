import { BigNumber } from 'bignumber.js';

/**
 * Formats a given date into different formats based on how much time has elapsed since that date.
 *
 * @param date - The date to be formatted.
 * @returns The formatted date.
 */
export function formatMenuItemDate(date: Date) {
  const elapsed = Math.abs(Date.now() - date.getTime());
  const diffDays = elapsed / (1000 * 60 * 60 * 24);

  // E.g. Yesterday
  if (diffDays < 1) {
    return new Intl.DateTimeFormat('en', {
      hour: 'numeric',
      minute: 'numeric',
      hour12: false,
    }).format(date);
  }

  // E.g. 12:21
  if (Math.floor(diffDays) === 1) {
    return new Intl.RelativeTimeFormat('en', { numeric: 'auto' }).format(
      -1,
      'day',
    );
  }

  // E.g. 21 Oct
  if (diffDays > 1 && diffDays < 365) {
    return new Intl.DateTimeFormat('en', {
      month: 'short',
      day: 'numeric',
    }).format(date);
  }

  // E.g. 21 Oct 2022
  return new Intl.DateTimeFormat('en', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date);
}

type FormatOptions = {
  decimalPlaces?: number;
  shouldEllipse?: boolean;
};
const defaultFormatOptions = {
  decimalPlaces: 4,
};

export const getLeadingZeroCount = (num: number | string) => {
  const numToString = new BigNumber(num).toString();
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
 * @param numericAmount
 * @param opts
 * @returns
 */
export const formatAmount = (numericAmount: number, opts?: FormatOptions) => {
  // create options with defaults
  const options = { ...defaultFormatOptions, ...opts };

  const leadingZeros = getLeadingZeroCount(numericAmount);
  const isDecimal =
    numericAmount.toString().includes('.') ||
    leadingZeros > 0 ||
    numericAmount.toString().includes('e-');
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

/**
 * Generates a unique key based on the provided text, index, and a random string.
 *
 * @param text - The text to be included in the key.
 * @param index - The index to be included in the key.
 * @returns The generated unique key.
 */
export const getRandomKey = (text: string, index: number) => {
  const key = `${text
    .replace(/\s+/gu, '_')
    .replace(/[^\w-]/gu, '')}-${index}-${Math.random()
    .toString(36)
    .substring(2, 15)}`;

  return key;
};
