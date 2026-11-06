import {
  DEEP_LINK_ORIGIN,
  createHomeQrCodeDestination,
  HomeQueryParams,
} from './home';
import { DISCOVER_SEARCH_ROUTE, Route } from './route';

const SEARCH_SCREEN = 'search';
const SEARCH_QUERY_PARAM = 'q';

/**
 * DeepLink for trending content and Explore Search.
 *
 * Signed `/trending` deep links with `screen=search` open Explore Search,
 * optionally pre-populated from `q`. Other `/trending` deep links retain the
 * mobile QR-code flow.
 */
export const trending = new Route({
  pathname: '/trending',
  getTitle: (_: URLSearchParams) => 'deepLink_theTrendingPage',
  handler: function handler(params: URLSearchParams) {
    if (params.get('screen') === SEARCH_SCREEN) {
      const query = params.get(SEARCH_QUERY_PARAM);
      const searchParams = new URLSearchParams();

      if (query) {
        searchParams.set(SEARCH_QUERY_PARAM, query);
      }

      return { path: DISCOVER_SEARCH_ROUTE, query: searchParams };
    }

    const deepLinkUrl = new URL('/trending', DEEP_LINK_ORIGIN);
    params.forEach((value, key) => deepLinkUrl.searchParams.append(key, value));

    return createHomeQrCodeDestination(
      HomeQueryParams.TrendingDeepLinkUrl,
      deepLinkUrl.toString(),
    );
  },
});
