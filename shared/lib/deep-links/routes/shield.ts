import {
  SETTINGS_ROUTE,
  SHIELD_PLAN_ROUTE,
  // eslint-disable-next-line import-x/no-restricted-paths -- Preserve the existing dependency exposed by removing its barrel.
} from '../../../../ui/helpers/constants/routes';
import { Route } from './route';

export const SHIELD_QUERY_PARAMS = {
  showShieldEntryModal: 'showShieldEntryModal',
};

export const shield = new Route({
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
