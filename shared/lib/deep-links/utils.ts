import log from 'loglevel';
import browser from 'webextension-polyfill';
import {
  DeferredDeepLink,
  DeferredDeepLinkRoute,
  DeferredDeepLinkRouteType,
} from './types';
import { parse } from './parse';
import { VALID } from './verify';
import { DEEP_LINK_ROUTE } from './routes/route';

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
 * Extracts the deferred deep link cookie value.
 *
 * @returns The parsed deferred deep link data or null if not found.
 */
export async function getDeferredDeepLinkFromCookie(): Promise<DeferredDeepLink | null> {
  try {
    const cookie = await browser.cookies.get({
      url: 'https://metamask.io/',
      name: 'deferred_deeplink',
    });

    if (!cookie) {
      return null;
    }

    try {
      const cookieData = JSON.parse(cookie.value);

      // Validate the parsed data
      if (
        !cookieData.referringLink ||
        typeof cookieData.referringLink !== 'string'
      ) {
        log.error('Invalid referringLink in deferred_deeplink cookie.');
        return null;
      }

      // Validate if createdAt is a valid number (timestamp)
      if (
        typeof cookieData.createdAt !== 'number' ||
        !Number.isFinite(cookieData.createdAt)
      ) {
        log.error('Invalid createdAt value in deferred_deeplink cookie.');
        return null;
      }

      return {
        createdAt: cookieData.createdAt,
        referringLink: cookieData.referringLink,
      };
    } catch (error) {
      log.error('Failed to parse deferred_deeplink cookie.', error);
      return null;
    }
  } catch (error) {
    log.error(
      'Failed to use browser API for deferred deep link cookies.',
      error,
    );
    return null;
  }
}

/**
 * Extracts the route from a deferred deep link.
 * This function parses the referring link URL and extracts the destination.
 * If the destination is an external URL (redirectTo), it returns the full URL.
 * If the destination is an internal route with a valid signature, it returns the path with query parameters.
 * If the signature is missing or invalid, it returns an interstitial route to show a warning page.
 *
 * @param deferredDeepLink - The deferred deep link data, or null if none is stored.
 * @returns A DeferredDeepLinkRoute with either:
 * - `type: DeferredDeepLinkRouteType.Redirect` and `url: string` for external URLs.
 * - `type: DeferredDeepLinkRouteType.Navigate` and `route: string` for internal routes with valid signature.
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

    const { destination, signature } = parsed;

    // If the destination has a redirectTo property, it's an external URL redirect
    if ('redirectTo' in destination) {
      return {
        type: DeferredDeepLinkRouteType.Redirect,
        url: destination.redirectTo.toString(),
      };
    }

    // For internal routes, check the signature
    // If signature is not valid (missing or invalid), route to the interstitial page
    if (signature !== VALID) {
      return {
        type: DeferredDeepLinkRouteType.Interstitial,
        urlPathAndQuery: url.pathname + url.search,
      };
    }

    // Signature is valid - construct the internal route from path and query parameters
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
