import { MONEY_HOME_ROUTE, Route } from './route';

/**
 * Deeplink for the Money experience.
 *
 * It navigate to the money home.
 * If the user is ineligible for a money account they are redirected to the
 * wallet home by the money page.
 * - https://link.metamask.io/money
 */

export const money = new Route({
  pathname: '/money',
  getTitle: (_: URLSearchParams) => 'deepLink_theMoneyPage',
  handler: function handler(_params: URLSearchParams) {
    return {
      path: MONEY_HOME_ROUTE,
      query: new URLSearchParams(),
    };
  },
});
