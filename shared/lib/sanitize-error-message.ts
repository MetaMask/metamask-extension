/**
 * Segment-safe cap for analytics `error_message` values, shared by all
 * error-as-analytics producers.
 */
const MAX_ERROR_MESSAGE_LENGTH = 500;

/**
 * Normalizes whitespace and caps length for Segment `error_message`.
 *
 * @param message - Raw error text.
 * @returns Sanitized message safe to send in analytics.
 */
export function sanitizeErrorMessage(message: string): string {
  const trimmed = message.replace(/\s+/gu, ' ').trim();
  if (trimmed.length <= MAX_ERROR_MESSAGE_LENGTH) {
    return trimmed;
  }
  return `${trimmed.slice(0, MAX_ERROR_MESSAGE_LENGTH)}…`;
}
