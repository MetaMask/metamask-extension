import { Route } from './route';

export const rewards = new Route({
  pathname: '/rewards',
  getTitle: (_: URLSearchParams) => 'deepLink_theRewardsPage',
  handler: function handler(params: URLSearchParams) {
    return {
      path: '/rewards',
      query: new URLSearchParams(params),
    };
  },
});
