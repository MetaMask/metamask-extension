import { DEEP_LINK_HOST } from '../../../shared/lib/deep-links/constants';
import { NavigationOrigin, parse } from '../../../shared/lib/deep-links/parse';
import { resolveBuyDeepLinkDestination } from '../../../shared/lib/deep-links/buy-flow';

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
 * @param href - The link href to resolve.
 * @param isUnifiedBuyEnabled - Whether the unified buy (native in-app buy)
 * feature is enabled. With it on, `/buy` links resolve to the in-app entry
 * route instead of the external Portfolio redirect — matching how the
 * background deep-link router treats the same link.
 */
export async function resolveTrustedDeepLinkHref(
  href: string,
  isUnifiedBuyEnabled = false,
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

    // Route-specific destination resolution (e.g. `/buy` into the in-app
    // unified buy flow), so a trusted surface's `/buy` link behaves the same
    // no matter which surface it is clicked from.
    const destination = resolveBuyDeepLinkDestination({
      route: parsed.route,
      destination: parsed.destination,
      isUnifiedBuyEnabled,
    });

    if ('redirectTo' in destination) {
      return destination.redirectTo.toString();
    }

    return toInternalHref(destination.path, destination.query);
  } catch {
    return href;
  }
}
