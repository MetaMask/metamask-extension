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
