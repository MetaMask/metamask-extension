import { routes } from './routes';

/**
 * Handles mobile sharing only when no Extension route is registered.
 *
 * @param url - The parsed deep link, including its share parameter.
 * @returns The original link without `share=1`, or null when this fallback does not apply.
 */
export function getMobileShareUrl(url: URL): string | null {
  if (
    routes.has(url.pathname.toLowerCase()) ||
    !url.searchParams.has('share', '1')
  ) {
    return null;
  }

  const sharedUrl = new URL(url);
  // Preserve the original encoding and order of every other query parameter.
  sharedUrl.search = url.search
    .slice(1)
    .split('&')
    .filter((param) => new URLSearchParams(param).get('share') !== '1')
    .join('&');
  return sharedUrl.href;
}
