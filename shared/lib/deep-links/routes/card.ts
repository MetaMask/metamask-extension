import { BaseUrl } from '../../../constants/urls';
import { Route } from './route';

export default new Route({
  pathname: '/card-onboarding',
  getTitle: (_: URLSearchParams) => 'deepLink_theCardOnboardingPage',
  handler: function handler(params: URLSearchParams) {
    const cardUrl = new URL('/card', BaseUrl.MetaMask);
    params.forEach((value, key) => cardUrl.searchParams.append(key, value));
    return {
      redirectTo: cardUrl,
    };
  },
});
