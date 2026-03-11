/**
 * Get a boolean value for a string or boolean value.
 *
 * @param value - The value to convert to a boolean.
 * @returns `true` if the value is `'true'` or `true`, otherwise `false`.
 * @example
 * getBooleanFlag('true'); // true
 * getBooleanFlag(true); // true
 * getBooleanFlag('false'); // false
 * getBooleanFlag(false); // false
 */
export function getBooleanFlag(value: string | boolean | undefined): boolean {
  return value === true || value === 'true';
}
