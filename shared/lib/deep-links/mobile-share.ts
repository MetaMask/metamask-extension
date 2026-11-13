import { routes } from './routes';

/**
 * Checks whether an unregistered deep link requests the mobile QR fallback.
 *
 * @param url - The parsed deep link, including its share parameter.
 * @returns Whether the mobile fallback applies.
 */
export function isMobileShareFallback(url: URL): boolean {
  return (
    !routes.has(url.pathname.toLowerCase()) &&
    url.searchParams.has('share', '1')
  );
}

/**
 * Handles mobile sharing only when no Extension route is registered.
 *
 * @param url - The parsed deep link, including its share parameter.
 * @returns The original link without `share=1`, or null when this fallback does not apply.
 */
export function getMobileShareUrl(url: URL): string | null {
  if (!isMobileShareFallback(url)) {
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
