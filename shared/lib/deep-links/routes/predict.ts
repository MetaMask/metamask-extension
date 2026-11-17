import {
  DEEP_LINK_ORIGIN,
  createHomeQrCodeDestination,
  HomeQueryParams,
} from './home';
import { Route } from './route';

export const predict = new Route({
  pathname: '/predict',
  getTitle: (_: URLSearchParams) => 'deepLink_thePredictPage',
  handler: function handler(params: URLSearchParams) {
    const deepLinkUrl = new URL('/predict', DEEP_LINK_ORIGIN);
    params.forEach((value, key) => deepLinkUrl.searchParams.append(key, value));

    return createHomeQrCodeDestination(
      HomeQueryParams.PredictDeepLinkUrl,
      deepLinkUrl.toString(),
    );
  },
});
