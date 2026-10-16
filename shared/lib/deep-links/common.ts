// no destructuring as process.env detection stops working
export const CANONICAL_DEEP_LINK_HOST =
  process.env.CANONICAL_DEEP_LINK_HOST ?? 'link.metamask.io';

// `DEEP_LINK_HOSTS` configures every host accepted for incoming deep links.
// `CANONICAL_DEEP_LINK_HOST` remains separate for legacy .io signatures.
const configuredDeepLinkHosts = (
  process.env.DEEP_LINK_HOSTS ?? 'link.metamask.io,link.metamask.com'
)
  .split(',')
  .map((host) => host.trim())
  .filter(Boolean);
export const DEEP_LINK_HOSTS = [
  CANONICAL_DEEP_LINK_HOST,
  ...configuredDeepLinkHosts.filter(
    (host) => host !== CANONICAL_DEEP_LINK_HOST,
  ),
];

/**
 * Checks whether a hostname belongs to a configured MetaMask deep-link host.
 *
 * @param hostname - The hostname to check.
 * @returns Whether the hostname is a configured deep-link host.
 */
export function isDeepLinkHost(hostname: string): boolean {
  return DEEP_LINK_HOSTS.includes(hostname);
}

export const DEEP_LINK_MAX_LENGTH = 2048;
export const SIG_PARAM = 'sig';
export const SIG_PARAMS_PARAM = 'sig_params';

// Internal page that receives `/buy` deep link params and routes into the
// in-app unified buy flow (registered in the UI as RAMPS_BUY_DEEP_LINK_ENTRY_ROUTE).
export const RAMPS_BUY_DEEP_LINK_ENTRY_PATH = '/ramps/buy-deeplink-entry';
