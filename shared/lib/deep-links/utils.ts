import log from 'loglevel';
import browser from 'webextension-polyfill';
import {
  DeferredDeepLink,
  DeferredDeepLinkRoute,
  DeferredDeepLinkRouteType,
} from './types';
import { parse } from './parse';

/**
 * Extracts the deferred deep link cookie value.
 *
 * @returns The parsed deferred deep link data or null if not found.
 */
export function getDeferredDeepLinkFromCookie(): Promise<DeferredDeepLink | null> {
  return new Promise((resolve) => {
    try {
      browser.cookies
        .get({
          url: 'https://metamask.io/',
          name: 'deferred_deeplink',
        })
        .then((cookie) => {
          if (!cookie) {
            resolve(null);
            return;
          }

          try {
            const cookieData = JSON.parse(cookie.value);

            // Validate the parsed data
            if (
              !cookieData.referringLink ||
              typeof cookieData.referringLink !== 'string'
            ) {
              log.error('Invalid referringLink in deferred_deeplink cookie.');
              resolve(null);
              return;
            }

            // Validate if createdAt is a valid number (timestamp)
            if (
              typeof cookieData.createdAt !== 'number' ||
              !Number.isFinite(cookieData.createdAt)
            ) {
              log.error('Invalid createdAt value in deferred_deeplink cookie.');
              resolve(null);
              return;
            }

            resolve({
              createdAt: cookieData.createdAt,
              referringLink: cookieData.referringLink,
            });
          } catch (error) {
            log.error('Failed to parse deferred_deeplink cookie.', error);
            resolve(null);
          }
        })
        .catch((error) => {
          log.error('Failed to retrieve cookie with browser API.', error);
          resolve(null);
        });
    } catch (error) {
      log.error(
        'Failed to use browser API for deferred deep link cookies.',
        error,
      );
      resolve(null);
    }
  });
}

/**
 * Extracts the route from a deferred deep link.
 * This function parses the referring link URL and extracts the destination.
 * If the destination is an external URL (redirectTo), it returns the full URL.
 * If the destination is an internal route, it returns the path with query parameters.
 *
 * @param deferredDeepLink - The deferred deep link data containing the referring link URL and creation timestamp.
 * @returns A DeferredDeepLinkRoute with either:
 * - `type: DeferredDeepLinkRouteType.Redirect` and `url: string` for external URLs.
 * - `type: DeferredDeepLinkRouteType.Navigate` and `route: string` for internal routes.
 * - `null` if parsing fails, the link is invalid, or the link is older than two hours.
 */
export async function getDeferredDeepLinkRoute(
  deferredDeepLink: DeferredDeepLink,
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

    const { destination } = parsed;

    // If the destination has a redirectTo property, it's an external URL redirect
    if ('redirectTo' in destination) {
      return {
        type: DeferredDeepLinkRouteType.Redirect,
        url: destination.redirectTo.toString(),
      };
    }

    // Otherwise, construct the internal route from path and query parameters
    const { path, query } = destination;
    const queryString = query.toString();

    return {
      type: DeferredDeepLinkRouteType.Navigate,
      route: queryString ? `${path}?${queryString}` : path,
    };
  } catch (error) {
    log.error('Failed to parse deferred deep link:', deferredDeepLink, error);
    return null;
  }
}
