import urlLib from 'url';

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
 * Best-effort registrable domain (eTLD+1) for a URL, using the last two
 * hostname labels. Used to group RPC endpoints by provider so a single
 * provider's wide outage (e.g. *.infura.io) is treated as one failure
 * rather than many. Not a Public Suffix List implementation — multi-part
 * suffixes like ".co.uk" are not handled, which is fine for the RPC URL
 * universe but not for arbitrary web hosts.
 *
 * Localhost and IP addresses are returned verbatim.
 *
 * @param urlString - The URL to extract a registrable domain from.
 * @returns The registrable domain, or null if the URL is invalid.
 */
export function getRegistrableDomain(urlString: string): string | null {
  const url = getValidUrl(urlString);
  if (url === null) {
    return null;
  }

  const { hostname } = url;

  // IPv6 literal — URL.hostname wraps these in brackets.
  if (hostname.startsWith('[')) {
    return hostname;
  }

  // IPv4 literal or single-label host (e.g., "localhost").
  if (/^\d+\.\d+\.\d+\.\d+$/u.test(hostname) || !hostname.includes('.')) {
    return hostname;
  }

  const labels = hostname.split('.');
  return labels.slice(-2).join('.');
}
