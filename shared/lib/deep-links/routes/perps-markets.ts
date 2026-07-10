import { withDeeplinkAttribution } from './perps-attribution';
import { DEFAULT_ROUTE, Route } from './route';

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
  // Read original params so campaign `utm_*` (appended unsigned, absent from
  // the canonical/signed set) survive to `withDeeplinkAttribution`. Perps
  // deeplinks only open read-only screens, so unsigned routing params are safe.
  handlerSearchParams: 'original',
  handler: function handler(params: URLSearchParams) {
    const query = new URLSearchParams();
    query.set('tab', 'perps');
    return {
      path: DEFAULT_ROUTE,
      query: withDeeplinkAttribution(params, query),
    };
  },
});
