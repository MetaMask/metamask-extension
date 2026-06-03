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
export function prependZero(num: number, maxLength: number): string {
  return num.toString().padStart(maxLength, '0');
}

/**
 * Converts a camelCase or PascalCase string to kebab-case.
 * Handles leading uppercase letters without creating a leading hyphen.
 *
 * @param str - Input string (e.g., "startupStandardHome" or "SwapPage").
 * @returns Kebab-case string (e.g., "startup-standard-home" or "swap-page").
 */
export function toKebabCase(str: string): string {
  return str
    .replaceAll(/([A-Z])/gu, (char) => `-${char.toLowerCase()}`)
    .replace(/^-/u, '');
}

/**
 * Converts a kebab-case string to camelCase.
 * Used to convert filenames (e.g., 'onboarding-import-wallet')
 * to benchmark names (e.g., 'onboardingImportWallet').
 *
 * @param str - Kebab-case string (e.g., 'load-new-account')
 * @returns camelCase string (e.g., 'loadNewAccount')
 */
export function toCamelCase(str: string): string {
  return str.replaceAll(/-([a-z])/gu, (_, letter) => letter.toUpperCase());
}
