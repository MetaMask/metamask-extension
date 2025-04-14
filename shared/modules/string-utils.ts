/**
 * Compare 2 given strings and return boolean
 * eg: "foo" and "FOO" => true
 * eg: "foo" and "bar" => false
 * eg: "foo" and 123 => false
 *
 * @param value1 - first string to compare
 * @param value2 - first string to compare
 * @returns true if 2 strings are identical when they are lowercase
 */
export function isEqualCaseInsensitive(
  value1: string,
  value2: string,
): boolean {
  if (typeof value1 !== 'string' || typeof value2 !== 'string') {
    return false;
  }
  return value1.toLowerCase() === value2.toLowerCase();
}

/**
 * Takes a number with max length until the resulting string reaches the given length
 *
 * @param num
 * @param maxLength
 */
// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31889
// eslint-disable-next-line id-denylist
export function prependZero(num: number, maxLength: number): string {
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31889
  // eslint-disable-next-line id-denylist
  return num.toString().padStart(maxLength, '0');
}
