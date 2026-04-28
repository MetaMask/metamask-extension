const isDigit = (char: string): boolean => char >= '0' && char <= '9';

/**
 * Linear-time signed decimal validation with optional leading sign (+ or -) and
 * optional single decimal point. Accepts intermediate states like "-", "+", "-.", "+.".
 *
 * @param value - The input value to validate
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

/**
 * Defaults an empty stop-loss percentage field to negative RoE when the user
 * starts with an unsigned, non-zero value. This mirrors mobile's keypad
 * convenience without coercing later edits; positive SL RoE can be intentional
 * when a user is locking in profit on an existing position.
 *
 * @param value - The next raw input value
 * @param previousValue - The previous controlled input value
 */
export const applyDefaultStopLossSign = (
  value: string,
  previousValue: string,
): string => {
  if (
    previousValue ||
    value === '' ||
    value.startsWith('-') ||
    value.startsWith('+')
  ) {
    return value;
  }

  const numericValue = Number.parseFloat(value);
  if (!Number.isFinite(numericValue) || numericValue <= 0) {
    return value;
  }

  return `-${value}`;
};
