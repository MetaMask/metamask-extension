import {
  DEEP_LINK_ORIGIN,
  createHomeQrCodeDestination,
  HomeQueryParams,
} from './home';
import { Route } from './route';

export const batchSell = new Route({
  pathname: '/batch-sell',
  getTitle: (_: URLSearchParams) => 'deepLink_theBatchSellPage',
  handlerSearchParams: 'original',
  handler: function handler(params: URLSearchParams) {
    const deeplinkUrl = new URL('/batch-sell', DEEP_LINK_ORIGIN);
    params.forEach((value, key) => deeplinkUrl.searchParams.append(key, value));

    return createHomeQrCodeDestination(
      HomeQueryParams.BatchSellDeeplinkUrl,
      deeplinkUrl.toString(),
    );
  },
});
