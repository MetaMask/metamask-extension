import {
  DEEP_LINK_ORIGIN,
  createHomeQrCodeDestination,
  HomeQueryParams,
} from './home';
import { Route } from './route';

export const batchSell = new Route({
  pathname: '/batch-sell',
  getTitle: (_: URLSearchParams) => 'deepLink_theBatchSellPage',
  handler: function handler() {
    const deeplinkUrl = new URL('/batch-sell', DEEP_LINK_ORIGIN);

    return createHomeQrCodeDestination(
      HomeQueryParams.BatchSellDeeplinkUrl,
      deeplinkUrl.toString(),
    );
  },
});
