import { withDeeplinkAttribution } from './perps-attribution';
import { PERPS_MARKET_DETAIL_ROUTE, Route } from './route';

/**
 * Shorthand deeplink for a specific perps market asset detail page.
 * Mirrors mobile's ACTIONS.PERPS_ASSET. Equivalent to /perps?screen=asset&symbol=<symbol>.
 *
 * Supported URL formats:
 * - https://link.metamask.io/perps-asset?symbol=BTC
 * - https://link.metamask.io/perps-asset?symbol=ETH
 * - https://link.metamask.io/perps-asset?symbol=SOL
 * - https://link.metamask.io/perps-asset?symbol=xyz:TSLA   (HIP-3 stock)
 * - https://link.metamask.io/perps-asset?symbol=xyz:GOLD   (HIP-3 commodity)
 * - https://link.metamask.io/perps-asset?symbol=xyz:EUR    (HIP-3 forex)
 *
 * Parameters:
 * - symbol: market symbol (required). Standard crypto (e.g. 'BTC') or HIP-3 format (e.g. 'xyz:TSLA').
 */
export const perpsAsset = new Route({
  pathname: '/perps-asset',
  getTitle: (_: URLSearchParams) => 'deepLink_thePerpsMarketDetailPage',
  // Read original params so campaign `utm_*` (appended unsigned, absent from
  // the canonical/signed set) survive to `withDeeplinkAttribution`. Perps
  // deeplinks only open read-only screens, so unsigned routing params are safe.
  handlerSearchParams: 'original',
  handler: function handler(params: URLSearchParams) {
    const symbol = params.get('symbol');

    if (!symbol) {
      throw new Error('Missing symbol parameter');
    }

    return {
      path: `${PERPS_MARKET_DETAIL_ROUTE}/${encodeURIComponent(symbol)}`,
      query: withDeeplinkAttribution(params),
    };
  },
});
