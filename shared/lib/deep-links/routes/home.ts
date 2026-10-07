import { CANONICAL_DEEP_LINK_HOST } from '../constants';
// eslint-disable-next-line import-x/no-restricted-paths -- Preserve the existing dependency exposed by removing its barrel.
import { DEFAULT_ROUTE } from '../../../../ui/helpers/constants/routes';
import { Route } from './route';
import type { Destination } from './route';

export const DEEP_LINK_ORIGIN = `https://${CANONICAL_DEEP_LINK_HOST}`;

export enum HomeQueryParams {
  BatchSellDeeplinkUrl = 'batchSellDeeplinkUrl',
  OpenNetworkSelector = 'openNetworkSelector',
  PredictDeeplinkUrl = 'predictDeeplinkUrl',
  TrendingDeeplinkUrl = 'trendingDeeplinkUrl',
}

export function createHomeQrCodeDestination(
  queryParam:
    | HomeQueryParams.BatchSellDeeplinkUrl
    | HomeQueryParams.PredictDeeplinkUrl
    | HomeQueryParams.TrendingDeeplinkUrl,
  deeplinkUrl: string,
): Destination {
  return {
    path: DEFAULT_ROUTE,
    query: new URLSearchParams({ [queryParam]: deeplinkUrl }),
  };
}

export const home = new Route({
  pathname: '/home',
  getTitle: (_: URLSearchParams) => 'deepLink_theHomePage',
  handler: function handler(params: URLSearchParams) {
    const query = new URLSearchParams();
    const openNetworkSelector = params.get(HomeQueryParams.OpenNetworkSelector);

    if (
      openNetworkSelector?.toLowerCase() === 'true' ||
      openNetworkSelector === '1'
    ) {
      query.set(HomeQueryParams.OpenNetworkSelector, 'true');
    }

    return { path: DEFAULT_ROUTE, query };
  },
});
