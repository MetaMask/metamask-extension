/**
 * Coerces a localized value into a plain string when possible.
 * Returns undefined when the value is not a non-empty string.
 *
 * @param value - The localized value to check.
 * @returns The original string value or undefined when it cannot be used safely.
 */
export function toPlainString(value: unknown): string | undefined {
  if (typeof value !== 'string') {
    return undefined;
  }

  return value.trim().length > 0 ? value : undefined;
}
