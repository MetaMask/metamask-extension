import { BaseUrl } from '../../../constants/urls';
import { RAMPS_BUY_INTERSTITIAL_ROUTE, Route } from './route';

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
  buyUrl.search = query.toString();
  return { redirectTo: buyUrl };
}

export const buy = new Route({
  pathname: '/buy',
  getTitle: (_: URLSearchParams) => 'deepLink_theBuyPage',
  handler: (params: URLSearchParams) => ({
    path: RAMPS_BUY_INTERSTITIAL_ROUTE,
    query: params,
  }),
});
