import {
  DEEP_LINK_ORIGIN,
  createHomeQrCodeDestination,
  HomeQueryParams,
} from './home';
import { Route } from './route';

export const batchSell = new Route({
  pathname: '/batch-sell',
  getTitle: (_: URLSearchParams) => 'deepLink_theBatchSellPage',
  handler: function handler(params: URLSearchParams) {
    const deepLinkUrl = new URL('/batch-sell', DEEP_LINK_ORIGIN);
    params.forEach((value, key) => deepLinkUrl.searchParams.append(key, value));

    return createHomeQrCodeDestination(
      HomeQueryParams.BatchSellDeepLinkUrl,
      deepLinkUrl.toString(),
    );
  },
});
