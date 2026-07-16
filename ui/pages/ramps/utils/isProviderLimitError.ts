/**
 * Whether a provider's quote error message is a user-actionable limit message,
 * e.g. "Minimum purchase is 12 EUR" / "Maximum purchase is 20 EUR".
 *
 * @param message - The raw provider error string from the quotes response.
 * @returns True when the message is a min/max purchase limit.
 */
export function isProviderLimitError(
  message: string | null | undefined,
): message is string {
  if (!message) {
    return false;
  }

  return /\b(minimum|maximum)\s+purchase\s+is\b/iu.test(message);
}
