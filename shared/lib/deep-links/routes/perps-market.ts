import { PERPS_MARKET_DETAIL_ROUTE, Route } from './route';

export enum PerpsMarketQueryParams {
  Symbol = 'symbol',
}

/**
 * Deeplink for a specific perps market detail page.
 * Supports both crypto and HIP-3 markets (stocks, commodities, forex).
 *
 * Example deeplink: https://link.metamask.io/perps/market?symbol=BTC-USD
 */
export const perpsMarket = new Route({
  pathname: '/perps/market',
  getTitle: (_: URLSearchParams) => 'deepLink_thePerpsMarketDetailPage',
  handler: function handler(params: URLSearchParams) {
    const symbol = params.get(PerpsMarketQueryParams.Symbol);

    if (!symbol) {
      throw new Error('Missing symbol parameter');
    }

    return {
      path: `${PERPS_MARKET_DETAIL_ROUTE}/${encodeURIComponent(symbol)}`,
      query: new URLSearchParams(),
    };
  },
});
