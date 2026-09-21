import type { Route, Destination } from './routes/route';
import { RAMPS_BUY_DEEP_LINK_ENTRY_PATH } from './constants';

type BuyDeepLinkRoute = Pick<Route, 'pathname'>;

type ResolveBuyDeepLinkDestinationOptions = {
  /** The parsed deep link route and destination. */
  route: BuyDeepLinkRoute;
  destination: Destination;
  /**
   * Whether the unified buy (native in-app buy) feature is enabled, e.g. the
   * `rampsEnabled` remote feature flag.
   */
  isUnifiedBuyEnabled: boolean;
};

/**
 * Resolves the final destination for a `/buy` deep link.
 *
 * The static `/buy` route redirects to the external Portfolio web app. When
 * the unified buy feature is enabled, the link is routed to the in-app buy
 * flow instead, with the deep link params forwarded to the entry page so the
 * token can be preselected (mobile parity).
 *
 * This intentionally does not change the interstitial policy: signature
 * verification and interstitial decisions are handled before the destination
 * is resolved.
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
}: ResolveBuyDeepLinkDestinationOptions): Destination {
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
