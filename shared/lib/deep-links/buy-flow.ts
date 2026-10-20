import { BaseUrl } from '../../constants/urls';
import type { Destination } from './routes/route';
import type { ParsedDeepLink } from './parse';
import { RAMPS_BUY_DEEP_LINK_ENTRY_PATH } from './common';

/**
 * Builds the legacy `/buy` destination: an external redirect to the Portfolio
 * web app with the deep link params forwarded verbatim.
 * @param query - The deep link query params to forward.
 * @returns The external redirect destination.
 */
export function getBuyPortfolioRedirectDestination(query: URLSearchParams): {
  redirectTo: URL;
} {
  const buyUrl = new URL('/buy', BaseUrl.Portfolio);
  query.forEach((value, key) => buyUrl.searchParams.append(key, value));
  return { redirectTo: buyUrl };
}

/**
 * With the unified buy feature enabled, routes a `/buy` deep link to the
 * in-app entry page (params forwarded, mobile parity) instead of the
 * external Portfolio redirect. Interstitial policy is unaffected: it is
 * decided before the destination is resolved.
 *
 * TODO(TRAM-4096): rollout shim for the `rampsEnabled` flag — once the flag
 * is at 100% and removed, route `/buy` to the entry page in `routes/buy.ts`
 * and delete this function and its flag threading.
 *
 * @param parsed - The parsed deep link (only its route and destination are used).
 * @param parsed.route
 * @param parsed.destination
 * @param isUnifiedBuyEnabled - Whether the unified buy feature is enabled.
 * @returns The destination to navigate to.
 */
export function resolveBuyDeepLinkDestination(
  { route, destination }: Pick<ParsedDeepLink, 'route' | 'destination'>,
  isUnifiedBuyEnabled: boolean,
): Destination {
  if (
    !isUnifiedBuyEnabled ||
    route.pathname !== '/buy' ||
    !('redirectTo' in destination)
  ) {
    return destination;
  }

  // The `/buy` route handler appends the deep link params verbatim to the
  // Portfolio URL, so they are forwarded from there.
  return {
    path: RAMPS_BUY_DEEP_LINK_ENTRY_PATH,
    query: destination.redirectTo.searchParams,
  };
}
