const isDigit = (char: string): boolean => char >= '0' && char <= '9';

/**
 * Formats a number for use in editable input fields. Always uses "." as the
 * decimal separator regardless of the user's locale, ensuring compatibility
 * with isUnsignedDecimalInput validation.
 * @param value - The number to format
 * @param maximumFractionDigits - Maximum fractional digits (default 6)
 */
export const formatNumberForInput = (
  value: number,
  maximumFractionDigits = 6,
): string =>
  new Intl.NumberFormat('en-US', {
    useGrouping: false,
    minimumFractionDigits: 0,
    maximumFractionDigits,
  }).format(value);

/**
 * Linear-time digit check for integer-style inputs.
 * @param value
 */
export const isDigitsOnlyInput = (value: string): boolean => {
  for (const char of value) {
    if (!isDigit(char)) {
      return false;
    }
  }
  return true;
};

/**
 * Linear-time unsigned decimal validation with optional single decimal point.
 * Accepts intermediate input states like ".".
 * @param value
 */
export const isUnsignedDecimalInput = (value: string): boolean => {
  let seenDecimal = false;
  for (const char of value) {
    if (char === '.') {
      if (seenDecimal) {
        return false;
      }
      seenDecimal = true;
      continue;
    }
    if (!isDigit(char)) {
      return false;
    }
  }
  return true;
};
