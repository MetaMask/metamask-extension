import { BaseUrl } from '../../../constants/urls';
import { Route } from './route';

const FOLLOW_TRADING_PATH = '/news/top-traders';

/**
 * Deeplink for the Follow Trading experience.
 *
 * Follow Trading currently only exists in MetaMask Mobile, so on the extension
 * we redirect the deep link to the feature's web landing page rather than an
 * in-app route. Mirrors the card-onboarding redirect pattern.
 *
 * Supported URL formats:
 * - https://link.metamask.io/top-traders
 */
export const topTraders = new Route({
  pathname: '/top-traders',
  getTitle: (_: URLSearchParams) => 'deepLink_theTopTradersPage',
  handler: function handler(_params: URLSearchParams) {
    return {
      redirectTo: new URL(FOLLOW_TRADING_PATH, BaseUrl.MetaMask),
    };
  },
});
