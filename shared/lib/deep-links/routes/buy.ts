import { RAMPS_BUY_INTERSTITIAL_ROUTE, Route } from './route';

export const buy = new Route({
  pathname: '/buy',
  getTitle: (_: URLSearchParams) => 'deepLink_theBuyPage',
  handler: (params: URLSearchParams) => ({
    path: RAMPS_BUY_INTERSTITIAL_ROUTE,
    query: params,
  }),
});
