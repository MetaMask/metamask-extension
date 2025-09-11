import { BaseUrl } from '../../../constants/urls';
import { Route } from './route';

export default new Route({
  pathname: '/buy',
  getTitle: (_: URLSearchParams) => 'deepLink_theBuyPage',
  handler: function handler(params: URLSearchParams) {
    const buyUrl = new URL('/buy', BaseUrl.Portfolio);
    params.forEach((value, key) => buyUrl.searchParams.append(key, value));
    return {
      redirectTo: buyUrl,
    };
  },
});
