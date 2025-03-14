import { isString } from 'lodash';

/**
 * Escapes hidden Unicode characters in a string
 *
 * @param str - The string to escape
 * @returns The escaped string
 */
export function escapeHiddenUnicode(str: string) {
  if (!str || !isString(str)) {
    return str;
  }

  return [...str]
    .map((char) => {
      const code = char.codePointAt(0);
      if (!code) {
        return char;
      }

      // Only escape hidden Unicode characters (non-printable, special Unicode control codes)
      if (
        (code >= 0x200b && code <= 0x200f) || // Zero-width, RTL, LTR markers
        (code >= 0x202a && code <= 0x202e) || // Unicode directional controls
        (code >= 0x2066 && code <= 0x2069) || // Formatting characters
        code === 0x2028 ||
        code === 0x2029 || // Line separator, paragraph separator
        code === 0xfeff || // Byte Order Mark (BOM)
        (code >= 0xe000 && code <= 0xf8ff) // Private-use characters
      ) {
        return `U+${code.toString(16).toUpperCase().padStart(4, '0')}`;
      }
      return char;
    })
    .join('');
}

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
