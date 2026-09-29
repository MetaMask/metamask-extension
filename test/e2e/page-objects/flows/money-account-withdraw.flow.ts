import { tEn } from '../../../lib/i18n-helpers';
import { Driver } from '../../webdriver/driver';
import { MoneyAccountWithdrawConfirmation } from '../pages/confirmations/money-account-withdraw-confirmation';
import { PayWithModal } from '../pages/confirmations/pay-with-modal';
import MoneyHomePage from '../pages/money/money-home-page';
import MoneyTransactionDetailsPage from '../pages/money/money-transaction-details-page';
import { loginAndOpenMoneyHome } from './money-account-deposit.flow';

export { loginAndOpenMoneyHome };

/**
 * Start a Money Account withdrawal from the Money home "Send" action.
 *
 * The transfer sheet (Between accounts / Perps / Predict) is not wired up in
 * the extension — Send opens the withdraw confirmation directly.
 *
 * @param driver - The WebDriver instance.
 * @param moneyHomePage - The loaded Money home page.
 * @returns The loaded withdraw confirmation.
 */
export async function openMoneyAccountWithdraw(
  driver: Driver,
  moneyHomePage: MoneyHomePage,
): Promise<MoneyAccountWithdrawConfirmation> {
  await moneyHomePage.clickSend();

  const confirmation = new MoneyAccountWithdrawConfirmation(driver);
  await confirmation.checkPageIsLoaded();
  return confirmation;
}

/**
 * Pick the receive token from the wallet asset list via the pay-with pill.
 * Withdraw labels that picker "Withdraw to".
 *
 * @param driver - The WebDriver instance.
 * @param confirmation - The loaded withdraw confirmation.
 * @param chainId - Hex chain id of the token, e.g. `0x1`.
 * @param symbol - Token symbol, e.g. `USDC`.
 */
export async function selectWithdrawReceiveToken(
  driver: Driver,
  confirmation: MoneyAccountWithdrawConfirmation,
  chainId: string,
  symbol: string,
): Promise<void> {
  console.log(`Select withdraw receive token ${symbol} on ${chainId}`);
  await confirmation.clickPayWithPill();

  const payWithModal = new PayWithModal(driver, tEn('withdrawTo'));
  await payWithModal.checkPageIsLoaded();
  await payWithModal.openOtherAssets();
  await payWithModal.selectToken(chainId, symbol);

  await confirmation.checkPayWithToken(symbol);
}

/**
 * After confirming a withdrawal: verify the Money home shows the settled
 * "Sent" activity row and its details page reports Confirmed.
 *
 * @param driver - The WebDriver instance.
 * @param fiatAmount - Expected activity fiat amount, e.g. `-$50.00`.
 */
export async function verifyMoneyWithdrawSent(
  driver: Driver,
  fiatAmount: string,
): Promise<void> {
  const moneyHomePage = new MoneyHomePage(driver);
  await moneyHomePage.checkPageIsLoaded();
  await moneyHomePage.checkSentActivity(fiatAmount);
  await moneyHomePage.clickActivityItem(tEn('moneyActivitySent'));

  const detailsPage = new MoneyTransactionDetailsPage(driver);
  await detailsPage.checkPageIsLoaded();
  await detailsPage.checkStatusIsConfirmed();
}
