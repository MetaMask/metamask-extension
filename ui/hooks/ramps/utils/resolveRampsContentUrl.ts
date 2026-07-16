const RAMPS_CONTENT_BASE_URL_PRODUCTION =
  'https://on-ramp-content.api.cx.metamask.io';
const RAMPS_CONTENT_BASE_URL_STAGING =
  'https://on-ramp-content.uat-api.cx.metamask.io';

/**
 * Base URL for on-ramp content assets (provider logos, etc.).
 *
 * @returns Content CDN origin for the current MetaMask environment.
 */
export function getRampsContentBaseUrl(): string {
  const env = process.env.METAMASK_ENVIRONMENT;
  switch (env) {
    case 'production':
    case 'beta':
    case 'rc':
      return RAMPS_CONTENT_BASE_URL_PRODUCTION;
    default:
      return RAMPS_CONTENT_BASE_URL_STAGING;
  }
}

/**
 * Resolves provider logo paths from the providers API.
 * v2 providers often return relative paths like `/assets/providers/foo_light.png`.
 *
 * @param pathOrUrl - Absolute URL or relative content path.
 * @returns Absolute URL, or null when empty.
 */
export function resolveRampsContentUrl(
  pathOrUrl: string | null | undefined,
): string | null {
  if (!pathOrUrl) {
    return null;
  }

  if (/^https?:\/\//iu.test(pathOrUrl)) {
    return pathOrUrl;
  }

  const base = getRampsContentBaseUrl();
  const path = pathOrUrl.startsWith('/') ? pathOrUrl : `/${pathOrUrl}`;
  return `${base}${path}`;
}
