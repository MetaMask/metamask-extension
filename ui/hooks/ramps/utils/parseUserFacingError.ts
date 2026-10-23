/**
 * Detects technical fetch/HTTP error messages that must not be shown to users.
 * Matches `@metamask/controller-utils` `successfulFetch` style errors, e.g.
 * `Fetching 'https://.../v2/quotes?...' failed with status '401'`.
 * @param message
 */
function isTechnicalErrorMessage(message: string): boolean {
  const trimmed = message.trim();
  if (!trimmed) {
    return true;
  }

  if (/https?:\/\//iu.test(trimmed)) {
    return true;
  }

  if (/^Fetching\b.+\bfailed with status\b/iu.test(trimmed)) {
    return true;
  }

  if (/\bfailed with status\s*['"]?\d+/iu.test(trimmed)) {
    return true;
  }

  return false;
}

function resolveCandidateMessage(message: string): string | null {
  const trimmed = message.trim();
  if (!trimmed || isTechnicalErrorMessage(trimmed)) {
    return null;
  }
  return message;
}

/**
 * Extracts a user-facing error string, falling back when the error is missing
 * or only contains a technical fetch/HTTP message.
 *
 * @param error - Unknown thrown/returned error value.
 * @param fallbackMessage - Localized message to show when no safe message exists.
 * @returns A string safe to render in the UI.
 */
export function parseUserFacingError(
  error: unknown,
  fallbackMessage: string,
): string {
  if (error instanceof Error && error.message) {
    return resolveCandidateMessage(error.message) ?? fallbackMessage;
  }

  if (typeof error === 'string') {
    return resolveCandidateMessage(error) ?? fallbackMessage;
  }

  if (typeof error === 'object' && error !== null && 'error' in error) {
    const resourceError = (error as { error?: unknown }).error;
    if (typeof resourceError === 'string') {
      return resolveCandidateMessage(resourceError) ?? fallbackMessage;
    }
  }

  return fallbackMessage;
}
