import log from 'loglevel';
import {
  DeferredDeepLink,
  DeferredDeepLinkRoute,
  DeferredDeepLinkRouteType,
} from './types';
import { parse } from './parse';
import { VALID } from './verify';
import { DEEP_LINK_ROUTE } from './routes/route';
import { isDeepLinkRouteAllowedToBypassInterstitial } from './routes/interstitial-bypass';

/**
 * Builds the interstitial page route with the given URL path and query.
 * This is used to redirect users to the interstitial warning page for
 * unsigned or invalidly signed deferred deep links.
 *
 * @param urlPathAndQuery - The URL path and query to pass to the interstitial page.
 * @returns The interstitial page route (e.g., /link?u=/buy?address=0x...)
 */
export function buildInterstitialRoute(urlPathAndQuery: string): string {
  const params = new URLSearchParams({ u: urlPathAndQuery });
  return `${DEEP_LINK_ROUTE}?${params.toString()}`;
}

/**
 * Extracts the route from a deferred deep link.
 * This function parses the referring link URL and extracts the destination.
 * If the destination is an external URL (redirectTo) with a valid signature or
 * interstitial-bypass route, it returns the full URL. If the destination is an
 * internal route with a valid signature or is allowed to bypass the interstitial,
 * it returns the path with query parameters. If the signature is missing or
 * invalid for a non-bypass route, it returns an interstitial route to show a
 * warning page.
 *
 * @param deferredDeepLink - The deferred deep link data, or null if none is stored.
 * @returns A DeferredDeepLinkRoute with either:
 * - `type: DeferredDeepLinkRouteType.Redirect` and `url: string` for external URLs with valid signature or interstitial bypass.
 * - `type: DeferredDeepLinkRouteType.Navigate` and `route: string` for internal routes with valid signature or interstitial bypass.
 * - `type: DeferredDeepLinkRouteType.Interstitial` and `urlPathAndQuery: string` for unsigned/invalid signature links.
 * - `null` if the input is null, parsing fails, the link is invalid, or the link is older than two hours.
 */
export async function getDeferredDeepLinkRoute(
  deferredDeepLink: DeferredDeepLink | null,
): Promise<DeferredDeepLinkRoute> {
  if (!deferredDeepLink?.referringLink) {
    return null;
  }

  // Check if the deferred deep link is older than two hours
  const TWO_HOURS_IN_MILLISECONDS = 2 * 60 * 60 * 1000;
  const currentTime = Date.now();
  const linkAge = currentTime - deferredDeepLink.createdAt;

  if (linkAge > TWO_HOURS_IN_MILLISECONDS) {
    return null;
  }

  try {
    // Parse the referring link as a URL
    const url = new URL(deferredDeepLink.referringLink);

    // Parse the deep link to extract the destination path and query parameters
    const parsed = await parse(url);

    if (!parsed) {
      return null;
    }

    const { destination, route, signature } = parsed;
    const canBypassInterstitial =
      isDeepLinkRouteAllowedToBypassInterstitial(route);

    // If the destination has a redirectTo property, it's an external URL redirect.
    if ('redirectTo' in destination) {
      if (signature !== VALID && !canBypassInterstitial) {
        return {
          type: DeferredDeepLinkRouteType.Interstitial,
          urlPathAndQuery: url.pathname + url.search,
          signature,
        };
      }

      return {
        type: DeferredDeepLinkRouteType.Redirect,
        url: destination.redirectTo.toString(),
        signature,
      };
    }

    // For internal routes, check the signature unless the route is allowed to
    // bypass the interstitial.
    if (signature !== VALID && !canBypassInterstitial) {
      return {
        type: DeferredDeepLinkRouteType.Interstitial,
        urlPathAndQuery: url.pathname + url.search,
        signature,
      };
    }

    // Construct the internal route from path and query parameters.
    const { path, query } = destination;
    const queryString = query.toString();

    return {
      type: DeferredDeepLinkRouteType.Navigate,
      route: queryString ? `${path}?${queryString}` : path,
      signature,
    };
  } catch (error) {
    log.error('Failed to parse deferred deep link:', deferredDeepLink, error);
    return null;
  }
}
