import { MONEY_DEPOSIT_ROUTE, Route } from './route';

/**
 * Deeplink that starts a Money Account deposit.
 *
 * It navigates to the Money deposit bridge, which checks the Money account is
 * available and replaces itself with the deposit confirmation. Users who are
 * ineligible for a Money account are redirected to the wallet home.
 * - https://link.metamask.io/money-account-deposit
 */
export const moneyAccountDeposit = new Route({
  pathname: '/money-account-deposit',
  getTitle: (_: URLSearchParams) => 'deepLink_theMoneyDepositPage',
  handler: function handler(_params: URLSearchParams) {
    return {
      path: MONEY_DEPOSIT_ROUTE,
      query: new URLSearchParams(),
    };
  },
});
