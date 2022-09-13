export function isEqualCaseInsensitive(value1, value2) {
  if (typeof value1 !== 'string' || typeof value2 !== 'string') {
    return false;
  }
  return value1.toLowerCase() === value2.toLowerCase();
}

export function prependZero(num, maxLength) {
  return num.toString().padStart(maxLength, '0');
}
