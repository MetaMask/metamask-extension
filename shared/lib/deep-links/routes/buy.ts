import { getBuyPortfolioRedirectDestination } from '../buy-flow';
import { Route } from './route';

export const buy = new Route({
  pathname: '/buy',
  getTitle: (_: URLSearchParams) => 'deepLink_theBuyPage',
  handler: function handler(params: URLSearchParams) {
    return getBuyPortfolioRedirectDestination(params);
  },
});
