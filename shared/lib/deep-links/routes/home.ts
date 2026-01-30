import { DEFAULT_ROUTE, Route } from './route';

export enum HomeQueryParams {
  OpenNetworkPicker = 'openNetworkPicker',
}

export default new Route({
  pathname: '/home',
  getTitle: (_: URLSearchParams) => 'deepLink_theHomePage',
  handler: function handler(params: URLSearchParams) {
    const query = new URLSearchParams();
    const openNetworkPicker = params.get(HomeQueryParams.OpenNetworkPicker);

    if (
      openNetworkPicker?.toLowerCase() === 'true' ||
      openNetworkPicker === '1'
    ) {
      query.set(HomeQueryParams.OpenNetworkPicker, 'true');
    }

    return { path: DEFAULT_ROUTE, query };
  },
});
