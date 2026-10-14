// no destructuring as process.env detection stops working
export const CANONICAL_DEEP_LINK_HOST =
  process.env.CANONICAL_DEEP_LINK_HOST ?? 'link.metamask.io';

// `DEEP_LINK_HOSTS` configures every host accepted for incoming deep links.
// `CANONICAL_DEEP_LINK_HOST` remains separate because signed URLs always use
// that host.
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
 * Configured subdomains are accepted because the browser request filter also
 * matches subdomains.
 *
 * @param hostname - The hostname to check.
 * @returns Whether the hostname is a configured deep-link host or subdomain.
 */
export function isDeepLinkHost(hostname: string): boolean {
  return DEEP_LINK_HOSTS.some(
    (host) => hostname === host || hostname.endsWith(`.${host}`),
  );
}

export const DEEP_LINK_MAX_LENGTH = 2048;
export const SIG_PARAM = 'sig';
export const SIG_PARAMS_PARAM = 'sig_params';
