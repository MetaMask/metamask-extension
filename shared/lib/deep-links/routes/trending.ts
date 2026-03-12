import { DEFAULT_ROUTE, Route } from './route';

export const trending = new Route({
  pathname: '/trending',
  getTitle: (_: URLSearchParams) => 'deepLink_theHomePage',
  handler: function handler(_params: URLSearchParams) {
    return { path: DEFAULT_ROUTE, query: new URLSearchParams() };
  },
});
