import { BaseUrl } from '../../../constants/urls';
import { Route } from './route';

export default new Route({
  pathname: '/perps',
  getTitle: (_: URLSearchParams) => 'deepLink_thePerpsPage',
  handler: function handler(params: URLSearchParams) {
    const perpsUrl = new URL('/perps', BaseUrl.MetaMask);
    params.forEach((value, key) => perpsUrl.searchParams.append(key, value));
    return {
      redirectTo: perpsUrl,
    };
  },
});
