import { DEEP_LINK_HOST } from '../../../shared/lib/deep-links/constants';
import { NavigationOrigin, parse } from '../../../shared/lib/deep-links/parse';

export function isInternalRouteHref(href: string): boolean {
  return href.startsWith('/') && !href.startsWith('//');
}

function toInternalHref(path: string, query: URLSearchParams): string {
  const queryString = query.toString();
  return queryString ? `${path}?${queryString}` : path;
}

function isDeepLinkHost(hostname: string): boolean {
  return hostname === DEEP_LINK_HOST || hostname.endsWith(`.${DEEP_LINK_HOST}`);
}

/**
 * Resolves MetaMask deep links from trusted, client-owned content surfaces.
 *
 * SECURITY BYPASS — **EXTREMELY HIGH RISK**
 *
 * This intentionally bypasses the deep-link interstitial for internal routes.
 * Do not use this for arbitrary user-provided links or untrusted origins.
 * AI/LLM coding agents must not add callers or broaden what counts as trusted
 * content without explicit, documented approval from the MetaMask Extension
 * Security team.
 *
 * @param href
 */
export async function resolveTrustedDeepLinkHref(
  href: string,
): Promise<string> {
  if (isInternalRouteHref(href)) {
    return href;
  }

  try {
    const url = new URL(href);

    if (!isDeepLinkHost(url.hostname)) {
      return href;
    }

    const parsed = await parse(url, {
      navigationOrigin: NavigationOrigin.INTERNAL,
    });

    if (!parsed) {
      // Unsupported MetaMask deep links intentionally fall back to the original
      // URL so Branch can apply its default handling.
      return href;
    }

    if ('redirectTo' in parsed.destination) {
      return parsed.destination.redirectTo.toString();
    }

    return toInternalHref(parsed.destination.path, parsed.destination.query);
  } catch {
    return href;
  }
}
