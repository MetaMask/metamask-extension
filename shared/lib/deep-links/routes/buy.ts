import { BaseUrl } from '../../../constants/urls';
import { RAMPS_BUY_DEEP_LINK_ENTRY_PATH } from '../common';
import { Route, type RouteHandlerContext } from './route';

/**
 * Builds the legacy `/buy` destination: an external redirect to the Portfolio
 * web app with the deep link params forwarded verbatim.
 *
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

export const buy = new Route({
  pathname: '/buy',
  getTitle: (_: URLSearchParams) => 'deepLink_theBuyPage',
  handler: function handler(
    params: URLSearchParams,
    { getIsRampsEnabled }: RouteHandlerContext = {},
  ) {
    // TODO(TRAM-4096): once `rampsEnabled` is at 100% and removed, route to
    // the entry page unconditionally and delete the flag threading.
    if (getIsRampsEnabled?.()) {
      return {
        path: RAMPS_BUY_DEEP_LINK_ENTRY_PATH,
        query: params,
      };
    }
    return getBuyPortfolioRedirectDestination(params);
  },
});
