import {
  DEEP_LINK_ORIGIN,
  createHomeQrCodeDestination,
  HomeQueryParams,
} from './home';
import { Route } from './route';

/**
 * Deeplink for the Follow Trading experience.
 *
 * Follow Trading currently only exists in MetaMask Mobile, so on the extension
 * we land on the wallet home and open a QR code modal containing the identical
 * `/top-traders` deep link, letting the user continue on mobile. This mirrors
 * the batch-sell and prediction markets QR patterns.
 *
 * Supported URL formats:
 * - https://link.metamask.io/top-traders
 */
export const topTraders = new Route({
  pathname: '/top-traders',
  getTitle: (_: URLSearchParams) => 'deepLink_theTopTradersPage',
  handlerSearchParams: 'original',
  handler: function handler(params: URLSearchParams) {
    const deeplinkUrl = new URL('/top-traders', DEEP_LINK_ORIGIN);
    params.forEach((value, key) => deeplinkUrl.searchParams.append(key, value));

    return createHomeQrCodeDestination(
      HomeQueryParams.TopTradersDeeplinkUrl,
      deeplinkUrl.toString(),
    );
  },
});
