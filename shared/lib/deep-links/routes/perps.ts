import { DEFAULT_ROUTE, Route } from './route';

export const perps = new Route({
  pathname: '/perps',
  getTitle: (_: URLSearchParams) => 'deepLink_thePerpsPage',
  handler: function handler(_params: URLSearchParams) {
    const query = new URLSearchParams();
    query.set('tab', 'perps');
    return { path: DEFAULT_ROUTE, query };
  },
});
