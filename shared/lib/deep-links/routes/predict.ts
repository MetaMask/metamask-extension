import {
  DEEP_LINK_ORIGIN,
  createHomeQrCodeDestination,
  HomeQueryParams,
} from './home';
import { Route } from './route';

export const predict = new Route({
  pathname: '/predict',
  getTitle: (_: URLSearchParams) => 'deepLink_thePredictPage',
  handlerSearchParams: 'original',
  handler: function handler(params: URLSearchParams) {
    const deeplinkUrl = new URL('/predict', DEEP_LINK_ORIGIN);
    params.forEach((value, key) => deeplinkUrl.searchParams.append(key, value));

    return createHomeQrCodeDestination(
      HomeQueryParams.PredictDeeplinkUrl,
      deeplinkUrl.toString(),
    );
  },
});
