const isDigit = (char: string): boolean => char >= '0' && char <= '9';

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

/**
 * Linear-time signed decimal validation with optional leading sign (+ or -) and
 * optional single decimal point. Accepts intermediate states like "-", "+", "-.", "+.".
 * @param value
 */
export const isSignedDecimalInput = (value: string): boolean => {
  let startIndex = 0;
  if (value.startsWith('-') || value.startsWith('+')) {
    startIndex = 1;
  }

  let seenDecimal = false;
  for (let index = startIndex; index < value.length; index += 1) {
    const char = value[index];
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
