import { DEEP_LINK_HOST } from '../constants';
import { DEFAULT_ROUTE, Route } from './route';
import type { Destination } from './route';

export const DEEP_LINK_ORIGIN = `https://${DEEP_LINK_HOST}`;

export enum HomeQueryParams {
  OpenNetworkSelector = 'openNetworkSelector',
  PredictDeeplinkUrl = 'predictDeeplinkUrl',
}

export function createHomeQrCodeDestination(
  queryParam: HomeQueryParams.PredictDeeplinkUrl,
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
