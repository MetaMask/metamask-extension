/**
 * Whether a provider quote error is a user-actionable min/max purchase message.
 *
 * The on-ramp API emits hardcoded English strings such as
 * "Minimum purchase is 12 EUR". Only those should be shown; other technical
 * errors fall back to a generic "Quote unavailable" string.
 *
 * @param message - Raw provider error from the quotes response.
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
