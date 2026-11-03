import { MONEY_HOME_ROUTE, Route } from './route';

export const MONEY_DEPOSIT_DEEPLINK_PARAM = 'deposit';

/**
 * Deeplink that starts a Money Account deposit.
 *
 * It navigates to the Money home, which starts the deposit once the Money
 * account is available. Users who are ineligible for a Money account are
 * redirected to the wallet home by the Money page.
 * - https://link.metamask.io/money-account-deposit
 */
export const moneyAccountDeposit = new Route({
  pathname: '/money-account-deposit',
  getTitle: (_: URLSearchParams) => 'deepLink_theMoneyDepositPage',
  handler: function handler(_params: URLSearchParams) {
    return {
      path: MONEY_HOME_ROUTE,
      query: new URLSearchParams({ [MONEY_DEPOSIT_DEEPLINK_PARAM]: 'true' }),
    };
  },
});
