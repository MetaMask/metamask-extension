import {
  DEEP_LINK_ORIGIN,
  createHomeQrCodeDestination,
  HomeQueryParams,
} from './home';
import { Route } from './route';

export const trending = new Route({
  pathname: '/trending',
  getTitle: (_: URLSearchParams) => 'deepLink_theTrendingPage',
  handlerSearchParams: 'original',
  handler: function handler(params: URLSearchParams) {
    const deeplinkUrl = new URL('/trending', DEEP_LINK_ORIGIN);
    params.forEach((value, key) => deeplinkUrl.searchParams.append(key, value));

    return createHomeQrCodeDestination(
      HomeQueryParams.TrendingDeeplinkUrl,
      deeplinkUrl.toString(),
    );
  },
});
