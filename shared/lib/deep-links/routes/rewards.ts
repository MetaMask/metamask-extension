import { Route } from './route';

export const rewards = new Route({
  pathname: '/rewards',
  getTitle: (_: URLSearchParams) => 'deepLink_theRewardsPage',
  handler: function handler(params: URLSearchParams) {
    const query = new URLSearchParams(params);
    query.delete('referral');
    return {
      path: '/rewards',
      query,
    };
  },
});
