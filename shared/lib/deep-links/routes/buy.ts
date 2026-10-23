import { BaseUrl } from '../../../constants/urls';
import { RAMPS_BUY_DEEP_LINK_ENTRY_PATH } from '../common';
import { Route } from './route';

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
  handler: (params: URLSearchParams) => ({
    path: RAMPS_BUY_DEEP_LINK_ENTRY_PATH,
    query: params,
  }),
});
