import { Route, SHIELD_PLAN_ROUTE } from './route';

export default new Route({
  pathname: '/shield',
  getTitle: (_: URLSearchParams) => 'deepLink_theTransactionShieldPage',
  handler: function handler(params: URLSearchParams) {
    return {
      path: SHIELD_PLAN_ROUTE,
      query: params,
    };
  },
});
