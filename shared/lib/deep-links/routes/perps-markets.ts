// eslint-disable-next-line import-x/no-restricted-paths -- Preserve the existing dependency exposed by removing its barrel.
import { DEFAULT_ROUTE } from '../../../../ui/helpers/constants/routes';
import { Route } from './route';

/**
 * Deeplink alias for the Perps home tab (wallet home with Perps tab selected).
 * Mirrors mobile's ACTIONS.PERPS_MARKETS. Equivalent to /perps with no params.
 *
 * Supported URL formats:
 * - https://link.metamask.io/perps-markets
 *
 * No parameters are accepted. For filtered or deep navigation use /perps?screen=... instead.
 */
export const perpsMarkets = new Route({
  pathname: '/perps-markets',
  getTitle: (_: URLSearchParams) => 'deepLink_thePerpsPage',
  handler: function handler(_params: URLSearchParams) {
    const query = new URLSearchParams();
    query.set('tab', 'perps');
    return { path: DEFAULT_ROUTE, query };
  },
});
