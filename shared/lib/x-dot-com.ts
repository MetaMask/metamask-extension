/**
 * Checks if an origin is x.com or a subdomain of x.com.
 *
 * @param origin - The origin URL to check
 * @returns True if the hostname is x.com or *.x.com, false otherwise
 */
export function isXDotCom(origin: string): boolean {
  try {
    const url = new URL(origin);
    const hostname = url.hostname.toLowerCase();
    return hostname === 'x.com' || hostname.endsWith('.x.com');
  } catch {
    return false;
  }
}
