import { Route } from './route';

export default new Route({
  pathname: '/rewards',
  getTitle: (_: URLSearchParams) => 'deepLink_theRewardsPage',
  handler: function handler(params: URLSearchParams) {
    const query = new URLSearchParams(params);
    return {
      path: '/rewards',
      query,
    };
  },
});
