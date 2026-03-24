import { PERPS_ROUTE, Route } from './route';

export const perps = new Route({
  pathname: '/perps',
  getTitle: (_: URLSearchParams) => 'deepLink_thePerpsPage',
  handler: function handler(_params: URLSearchParams) {
    return {
      path: PERPS_ROUTE,
      query: new URLSearchParams(),
    };
  },
});
