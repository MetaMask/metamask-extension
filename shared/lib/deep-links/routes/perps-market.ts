import { PERPS_MARKET_DETAIL_ROUTE, Route } from './route';

export enum PerpsMarketQueryParams {
  MarketSymbol = 'symbol',
}

/**
 * Deeplink for a specific perps market detail page.
 * Supports both crypto and HIP-3 markets (stocks, commodities, forex).
 *
 * Example deeplinks:
 * - Crypto: https://link.metamask.io/perps/market?symbol=BTC
 * - HIP-3: https://link.metamask.io/perps/market?symbol=xyz:TSLA
 */
export const perpsMarket = new Route({
  pathname: '/perps/market',
  getTitle: (_: URLSearchParams) => 'deepLink_thePerpsMarketDetailPage',
  handler: function handler(params: URLSearchParams) {
    const symbol = params.get(PerpsMarketQueryParams.MarketSymbol);

    if (!symbol) {
      throw new Error('Missing symbol parameter');
    }

    return {
      path: `${PERPS_MARKET_DETAIL_ROUTE}/${encodeURIComponent(symbol)}`,
      query: new URLSearchParams(),
    };
  },
});
