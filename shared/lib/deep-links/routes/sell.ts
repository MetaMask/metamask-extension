import { BaseUrl } from '../../../constants/urls';
import { Route } from './route';

export const sell = new Route({
  pathname: '/sell',
  getTitle: (_: URLSearchParams) => 'deepLink_theSellPage',
  handler: function handler(params: URLSearchParams) {
    const sellUrl = new URL('/sell', BaseUrl.Portfolio);
    params.forEach((value, key) => sellUrl.searchParams.append(key, value));
    return {
      redirectTo: sellUrl,
    };
  },
});
