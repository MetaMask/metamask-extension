import {
  VALID_MARKET_FILTERS,
  type MarketFilter,
} from '../../../constants/perps';
import {
  DEFAULT_ROUTE,
  PERPS_MARKET_DETAIL_ROUTE,
  PERPS_MARKET_LIST_ROUTE,
  Route,
} from './route';

/**
 * Deeplink for the Perps experience.
 * Mirrors mobile's ACTIONS.PERPS handler in handlePerpsUrl.ts.
 *
 * Supported URL formats:
 *
 * Home (wallet home with Perps tab selected):
 * - https://link.metamask.io/perps
 * - https://link.metamask.io/perps?screen=tabs
 * - https://link.metamask.io/perps?screen=home
 * - https://link.metamask.io/perps?screen=markets   (backwards compat alias for home)
 *
 * Market detail (navigates directly to a specific market):
 * - https://link.metamask.io/perps?screen=asset&symbol=BTC
 * - https://link.metamask.io/perps?screen=asset&symbol=ETH
 * - https://link.metamask.io/perps?screen=asset&symbol=xyz:TSLA  (HIP-3 equity)
 * - https://link.metamask.io/perps?screen=asset&symbol=xyz:GOLD  (HIP-3 commodity)
 * - https://link.metamask.io/perps?screen=asset&symbol=xyz:EUR   (HIP-3 forex)
 *
 * Market list (with optional pre-selected filter tab):
 * - https://link.metamask.io/perps?screen=market-list
 * - https://link.metamask.io/perps?screen=market-list&tab=all
 * - https://link.metamask.io/perps?screen=market-list&tab=crypto
 * - https://link.metamask.io/perps?screen=market-list&tab=stocks
 * - https://link.metamask.io/perps?screen=market-list&tab=commodities
 * - https://link.metamask.io/perps?screen=market-list&tab=forex
 * - https://link.metamask.io/perps?screen=market-list&tab=new
 *
 * Parameters:
 * - screen: 'tabs' | 'home' | 'markets' | 'asset' | 'market-list' (optional, defaults to tabs)
 * - symbol: market symbol, required when screen=asset (e.g. 'BTC', 'ETH', 'xyz:TSLA')
 * - tab:    market filter, used when screen=market-list (e.g. 'crypto', 'stocks')
 *
 * Note: the `tab` param maps to the internal `filter` query param on the market list route.
 * Note: for /perps-asset shorthand see perps-asset.ts; for /perps-markets alias see perps-markets.ts.
 */
export const perps = new Route({
  pathname: '/perps',
  getTitle: (_: URLSearchParams) => 'deepLink_thePerpsPage',
  handler: function handler(params: URLSearchParams) {
    const screen = params.get('screen');
    const symbol = params.get('symbol');
    const tab = params.get('tab');

    switch (screen) {
      case 'asset': {
        if (!symbol) {
          throw new Error('Missing symbol parameter');
        }
        return {
          path: `${PERPS_MARKET_DETAIL_ROUTE}/${encodeURIComponent(symbol)}`,
          query: new URLSearchParams(),
        };
      }
      case 'market-list': {
        const query = new URLSearchParams();
        if (tab && VALID_MARKET_FILTERS.includes(tab as MarketFilter)) {
          query.set('filter', tab);
        }
        return { path: PERPS_MARKET_LIST_ROUTE, query };
      }
      default: {
        const query = new URLSearchParams();
        query.set('tab', 'perps');
        return { path: DEFAULT_ROUTE, query };
      }
    }
  },
});
