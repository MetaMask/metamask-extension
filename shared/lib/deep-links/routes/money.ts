import { BaseUrl } from '../../../constants/urls';
import { Route } from './route';

export const money = new Route({
  pathname: '/money',
  getTitle: (_: URLSearchParams) => 'deepLink_theMoneyPage',
  handler: function handler(params: URLSearchParams) {
    const moneyUrl = new URL('/money', BaseUrl.MetaMask);
    params.forEach((value, key) => moneyUrl.searchParams.append(key, value));
    return {
      redirectTo: moneyUrl,
    };
  },
});
