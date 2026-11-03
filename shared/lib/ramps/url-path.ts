/**
 * Strips a URL down to its pathname. Provider checkout/callback URLs carry
 * query params (provider codes, wallet address, etc.), so both the UI and
 * background analytics log only the pathname to avoid capturing PII.
 *
 * @param url - The URL to sanitize.
 * @returns The URL's pathname, or an empty string if `url` isn't parseable.
 */
export function sanitizeUrlPath(url: string): string {
  try {
    return new URL(url).pathname;
  } catch {
    return '';
  }
}
