import bowser from 'bowser';
import { OUTDATED_BROWSER_VERSIONS } from '../constants/common';

/**
 * Strips the following schemes from URL strings:
 * - http
 * - https
 *
 * @param urlString - The URL string to strip the scheme from
 * @returns The URL string, without the scheme, if it was stripped
 */
export function stripHttpSchemes(urlString: string): string {
  return urlString.replace(/^https?:\/\//u, '');
}

/**
 * Strips the following schemes from URL strings:
 * - https
 *
 * @param urlString - The URL string to strip the scheme from
 * @returns The URL string, without the scheme, if it was stripped
 */
export function stripHttpsScheme(urlString: string): string {
  return urlString.replace(/^https:\/\//u, '');
}

/**
 * Strips `https` schemes from URL strings, if the URL does not have a port
 *
 * @param urlString - The URL string to strip the scheme from
 * @returns The URL string, without the scheme, if it was stripped
 */
export function stripHttpsSchemeWithoutPort(urlString: string): string {
  if (getURL(urlString).port) {
    return urlString;
  }

  return stripHttpsScheme(urlString);
}

/**
 * Creates a URL object from a string
 *
 * @param url - URL string
 * @returns URL object or empty string if invalid
 */
export function getURL(url: string): URL | '' {
  try {
    return new URL(url);
  } catch (err) {
    return '';
  }
}

/**
 * Gets the host of a URL
 *
 * @param url - URL string
 * @returns Host part of the URL or empty string if invalid
 */
export function getURLHost(url: string): string {
  return getURL(url)?.host || '';
}

/**
 * Gets the hostname of a URL
 *
 * @param url - URL string
 * @returns Hostname part of the URL or empty string if invalid
 */
export function getURLHostName(url: string): string {
  return getURL(url)?.hostname || '';
}

/**
 * Checks whether a URL-like value is an extension URL
 *
 * @param urlLike - The URL-like value to test
 * @returns Whether the URL-like value is an extension URL
 */
export function isExtensionUrl(
  urlLike: string | URL | { protocol?: string },
): boolean {
  const EXT_PROTOCOLS = ['chrome-extension:', 'moz-extension:'];

  if (typeof urlLike === 'string') {
    for (const protocol of EXT_PROTOCOLS) {
      if (urlLike.startsWith(protocol)) {
        return true;
      }
    }
  }

  if (urlLike?.protocol) {
    return EXT_PROTOCOLS.includes(urlLike.protocol);
  }
  return false;
}

/**
 * Checks if the browser is deprecated based on version
 *
 * @param browser - Browser object from bowser
 * @returns True if the browser is deprecated
 */
export function getIsBrowserDeprecated(
  browser = bowser.getParser(window.navigator.userAgent),
): boolean {
  return browser.satisfies(OUTDATED_BROWSER_VERSIONS) ?? false;
}

/**
 * Check whether raw origin URL is an IP address
 *
 * @param rawOriginUrl - Raw origin (URL) with protocol that is potentially an IP address
 * @returns Boolean, true if the origin is an IP address, false otherwise
 */
export const isIpAddress = (rawOriginUrl: string): boolean => {
  if (typeof rawOriginUrl === 'string') {
    return Boolean(
      rawOriginUrl.match(/^(\d{1,3}\.){3}\d{1,3}$|^\[[0-9a-f:]+\]$/iu),
    );
  }

  return false;
};

/**
 * Transforms full raw URLs to something that can be used as title
 *
 * @param rawOrigin - Raw origin (URL) with protocol
 * @returns User friendly title extracted from raw URL
 */
export const transformOriginToTitle = (rawOrigin: string): string => {
  try {
    const url = new URL(rawOrigin);

    if (isIpAddress(url.hostname)) {
      return url.hostname;
    }

    const parts = url.hostname.split('.');
    return parts.slice(-2).join('.');
  } catch (e) {
    return 'Unknown Origin';
  }
};

/**
 * Checks if a URL is an IPFS URL
 *
 * @param url - The URL string to check
 * @returns Whether the URL is an IPFS URL
 */
export const isIpfsURL = (url: string): boolean => {
  return url.startsWith('ipfs://');
};
