/**
 * Checks if an origin string is a web origin (http:// or https://).
 * This is used to filter out non-web origins like chrome://, about://, moz-extension://, etc.
 *
 * @param origin - The origin string to check (e.g., "https://example.com", "chrome://newtab")
 * @returns true if the origin starts with http:// or https://, false otherwise
 */
export function isWebOrigin(origin: string | undefined | null): boolean {
  if (!origin) {
    return false;
  }
  return origin.startsWith('http://') || origin.startsWith('https://');
}
