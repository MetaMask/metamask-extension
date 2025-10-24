import { BaseUrl } from '../../../constants/urls';
import { Route } from './route';

export default new Route({
  pathname: '/rewards',
  getTitle: (_: URLSearchParams) => 'deepLink_theRewardsPage',
  handler: function handler(params: URLSearchParams) {
    const rewardsUrl = new URL('/rewards', BaseUrl.MetaMask);
    params.forEach((value, key) => rewardsUrl.searchParams.append(key, value));
    return {
      redirectTo: rewardsUrl,
    };
  },
});
