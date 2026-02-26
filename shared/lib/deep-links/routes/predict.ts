import { BaseUrl } from '../../../constants/urls';
import { Route } from './route';

export const predict = new Route({
  pathname: '/predict',
  getTitle: (_: URLSearchParams) => 'deepLink_thePredictPage',
  handler: function handler(params: URLSearchParams) {
    const predictUrl = new URL('/prediction-markets', BaseUrl.MetaMask);
    params.forEach((value, key) => predictUrl.searchParams.append(key, value));
    return {
      redirectTo: predictUrl,
    };
  },
});
