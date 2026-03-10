const DUMMY_BASE = 'http://a';

/**
 * Validates that a URL string is a safe internal route suitable for use with
 * React Router's `navigate()`. The value is parsed by the browser's URL
 * constructor against a dummy base; if the resolved origin changes the input
 * was an absolute or protocol-relative URL and is rejected.
 *
 * Only `pathname + search` from the parsed result are returned, stripping
 * fragments, credentials, or other URL components.
 *
 * @param value - The raw string to validate (e.g. from a URL search param).
 * @returns The sanitized pathname + search, or `undefined` when unsafe.
 */
export function sanitizeRedirectUrl(
  value: string | null | undefined,
): string | undefined {
  if (!value) {
    return undefined;
  }

  try {
    const parsed = new URL(value, DUMMY_BASE);

    if (parsed.origin !== DUMMY_BASE) {
      return undefined;
    }

    const safe = parsed.pathname + parsed.search;
    return safe === '/' ? undefined : safe;
  } catch {
    return undefined;
  }
}
