import urlLib from 'url';
import ipRegex from 'ip-regex';
import psl from 'psl';

export function addUrlProtocolPrefix(urlString: string) {
  let trimmed = urlString.trim();

  if (trimmed.length && !urlLib.parse(trimmed).protocol) {
    trimmed = `https://${trimmed}`;
  }

  if (getValidUrl(trimmed) !== null) {
    return trimmed;
  }

  return null;
}

export function getValidUrl(urlString: string): URL | null {
  try {
    const url = new URL(urlString);

    if (url.hostname.length === 0 || url.pathname.length === 0) {
      return null;
    }

    if (url.hostname !== decodeURIComponent(url.hostname)) {
      return null; // will happen if there's a %, a space, or other invalid character in the hostname
    }

    return url;
  } catch (error) {
    return null;
  }
}

export function isValidEmail(email: string): boolean {
  return email.match(/^([\w.%+-]+)@([\w-]+\.)+([\w]{2,})$/iu) !== null;
}

export function isWebUrl(urlString: string): boolean {
  const url = getValidUrl(urlString);

  return (
    url !== null && (url.protocol === 'https:' || url.protocol === 'http:')
  );
}

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

/**
 * Check if a hostname is localhost or an IP address.
 * Public RPC providers use domain names, not raw IP addresses.
 * These should never be considered "public" endpoints even if they appear in chainlist.
 *
 * @param hostname - The hostname to check.
 * @returns True if the hostname is localhost or an IP address (v4 or v6).
 */
export function isLocalhostOrIPAddress(hostname: string): boolean {
  const lowerHostname = hostname.toLowerCase();

  if (lowerHostname === 'localhost') {
    return true;
  }

  // Remove brackets from IPv6 addresses for testing (e.g., [::1] -> ::1)
  const hostnameWithoutBrackets = lowerHostname.replace(/^\[|\]$/gu, '');

  return ipRegex({ exact: true }).test(hostnameWithoutBrackets);
}

/**
 * Registrable domain (eTLD+1) for a URL, computed via the Public Suffix List
 * so multi-part suffixes like ".co.uk" resolve correctly. Used to group RPC
 * endpoints by provider so a single provider's wide outage (e.g. *.infura.io)
 * is treated as one failure rather than many.
 *
 * Localhost, IP literals, and single-label hosts are returned verbatim rather
 * than reduced to a domain (psl returns null or garbage for those, and callers
 * grouping by domain still need to distinguish them).
 *
 * @param urlString - The URL to extract a domain from.
 * @returns The domain, or null if the URL is invalid.
 */
export function getDomain(urlString: string): string | null {
  const url = getValidUrl(urlString);
  if (url === null) {
    return null;
  }

  const { hostname } = url;

  if (!hostname.includes('.') || isLocalhostOrIPAddress(hostname)) {
    return hostname;
  }

  return psl.get(hostname) ?? hostname;
}
