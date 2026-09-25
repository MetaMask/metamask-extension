import { BaseUrl } from '../../constants/urls';
import type { Route, Destination } from './routes/route';
import { RAMPS_BUY_DEEP_LINK_ENTRY_PATH } from './constants';

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
 * Resolves the final destination for a `/buy` deep link: with the unified buy
 * feature enabled, route to the in-app entry page (params forwarded so the
 * token can be preselected, mobile parity) instead of the external Portfolio
 * redirect. Interstitial policy is unaffected: signature verification and
 * interstitial decisions happen before the destination is resolved.
 *
 * @param options - The parsed deep link and the unified buy flag state.
 * @param options.route
 * @param options.destination
 * @param options.isUnifiedBuyEnabled
 * @returns The destination to navigate to.
 */
export function resolveBuyDeepLinkDestination({
  route,
  destination,
  isUnifiedBuyEnabled,
}: {
  route: Pick<Route, 'pathname'>;
  destination: Destination;
  /** Whether the unified buy (native in-app buy) feature is enabled. */
  isUnifiedBuyEnabled: boolean;
}): Destination {
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
