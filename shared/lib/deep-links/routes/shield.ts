import { Route, SETTINGS_ROUTE, SHIELD_PLAN_ROUTE } from './route';

export const SHIELD_QUERY_PARAMS = {
  showShieldEntryModal: 'showShieldEntryModal',
};

export default new Route({
  pathname: '/shield',
  getTitle: (_: URLSearchParams) => 'deepLink_theTransactionShieldPage',
  handler: function handler(params: URLSearchParams) {
    const shouldShowShieldEntryModal =
      params.get(SHIELD_QUERY_PARAMS.showShieldEntryModal) === 'true';

    if (shouldShowShieldEntryModal) {
      // link to settings page and show the shield entry modal
      return {
        path: SETTINGS_ROUTE,
        query: params,
      };
    }

    return {
      path: SHIELD_PLAN_ROUTE,
      query: params,
    };
  },
});
