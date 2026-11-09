import { DEEP_LINK_MAX_LENGTH, isDeepLinkHost } from './common';
import { routes } from './routes';

/**
 * Handles mobile sharing only when no Extension route is registered.
 *
 * @param urlString - The original deep link, including its share parameter.
 * @returns The original link without `share=1`, or null when this fallback does not apply.
 */
export function getMobileShareUrl(urlString: string): string | null {
  if (urlString.length > DEEP_LINK_MAX_LENGTH) {
    return null;
  }

  let url: URL;
  try {
    url = new URL(urlString);
  } catch {
    return null;
  }

  if (
    !['https:', 'http:'].includes(url.protocol) ||
    !isDeepLinkHost(url.hostname) ||
    routes.has(url.pathname.toLowerCase()) ||
    !url.searchParams.getAll('share').includes('1')
  ) {
    return null;
  }

  // Preserve the original encoding and order of every other query parameter.
  url.search = url.search
    .slice(1)
    .split('&')
    .filter((param) => new URLSearchParams(param).get('share') !== '1')
    .join('&');
  return url.href;
}
