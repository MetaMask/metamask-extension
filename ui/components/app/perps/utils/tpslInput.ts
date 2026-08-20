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

const normalizeLeadingZeros = (value: string): string => {
  const decimalIndex = value.indexOf('.');
  const integerPart =
    decimalIndex === -1 ? value : value.slice(0, decimalIndex);
  const decimalPart = decimalIndex === -1 ? '' : value.slice(decimalIndex);

  if (integerPart === '') {
    return decimalPart ? `0${decimalPart}` : value;
  }

  if (/^0+$/u.test(integerPart)) {
    return decimalPart ? `0${decimalPart}` : '0';
  }

  return `${integerPart.replace(/^0+/u, '')}${decimalPart}`;
};

const isZeroLikeInput = (value: string): boolean => {
  const unsignedValue =
    value.startsWith('-') || value.startsWith('+') ? value.slice(1) : value;

  return unsignedValue === '' || /^[0.]*$/u.test(unsignedValue);
};

/**
 * Defaults initial unsigned stop-loss percentage values to negative RoE and
 * mirrors mobile keypad leading-zero behavior. Positive SL RoE remains
 * available when a user edits an existing signed value or enters an explicit
 * "+" sign, which can be intentional when locking in profit on a position.
 *
 * @param value - The next raw input value
 * @param previousValue - The previous controlled input value
 */
export const applyDefaultStopLossSign = (
  value: string,
  previousValue: string,
): string => {
  if (value === '') {
    return value;
  }

  const sign = value.startsWith('-') || value.startsWith('+') ? value[0] : '';
  const unsignedValue = sign ? value.slice(1) : value;

  if (unsignedValue === '' || unsignedValue === '.') {
    return value;
  }

  const normalizedValue = normalizeLeadingZeros(unsignedValue);
  const signedValue = sign ? `${sign}${normalizedValue}` : normalizedValue;

  if (sign) {
    return signedValue;
  }

  const numericValue = Number.parseFloat(normalizedValue);
  if (!Number.isFinite(numericValue) || numericValue <= 0) {
    return normalizedValue;
  }

  return isZeroLikeInput(previousValue)
    ? `-${normalizedValue}`
    : normalizedValue;
};
