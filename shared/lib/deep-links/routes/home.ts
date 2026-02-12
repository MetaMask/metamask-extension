import { DEFAULT_ROUTE, Route } from './route';

export enum HomeQueryParams {
  OpenNetworkSelector = 'openNetworkSelector',
}

export default new Route({
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
