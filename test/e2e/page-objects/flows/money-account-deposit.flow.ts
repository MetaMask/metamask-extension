import { tEn } from '../../../lib/i18n-helpers';
import type { Anvil } from '../../seeder/anvil';
import { Driver } from '../../webdriver/driver';
import { AccountSelectModal } from '../pages/confirmations/account-select-modal';
import { MoneyAccountDepositConfirmation } from '../pages/confirmations/money-account-deposit-confirmation';
import { PayWithModal } from '../pages/confirmations/pay-with-modal';
import BottomNavBar from '../pages/home/bottom-nav-bar-page';
import MoneyHomePage from '../pages/money/money-home-page';
import MoneyTransactionDetailsPage from '../pages/money/money-transaction-details-page';
import { login } from './login.flow';

/**
 * Unlock the wallet and open the Money home page via the bottom nav Money
 * tab (bottom nav AB test treatment).
 *
 * @param driver - The WebDriver instance.
 * @param localNode - The Anvil node backing Mainnet, for balance validation.
 * @returns The loaded `MoneyHomePage`.
 */
export async function loginAndOpenMoneyHome(
  driver: Driver,
  localNode?: Anvil,
): Promise<MoneyHomePage> {
  await login(driver, { localNode, validateBalance: false });

  const bottomNavBar = new BottomNavBar(driver);
  await bottomNavBar.checkPageIsLoaded();
  await bottomNavBar.clickMoney();

  const moneyHomePage = new MoneyHomePage(driver);
  await moneyHomePage.checkPageIsLoaded();
  return moneyHomePage;
}

/**
 * Start a Money Account deposit from the Money home "Add" action.
 *
 * @param driver - The WebDriver instance.
 * @param moneyHomePage - The loaded Money home page.
 * @returns The loaded deposit confirmation.
 */
export async function openMoneyAccountDeposit(
  driver: Driver,
  moneyHomePage: MoneyHomePage,
): Promise<MoneyAccountDepositConfirmation> {
  await moneyHomePage.clickAdd();

  const confirmation = new MoneyAccountDepositConfirmation(driver);
  await confirmation.checkPageIsLoaded();
  return confirmation;
}

/**
 * Fund the deposit from a different wallet account via the from-account pill
 * and the "Select an account" modal.
 *
 * @param driver - The WebDriver instance.
 * @param confirmation - The loaded deposit confirmation.
 * @param address - Address of the account to fund from.
 * @param accountName - Display name expected on the pill afterwards.
 */
export async function selectDepositFundingAccount(
  driver: Driver,
  confirmation: MoneyAccountDepositConfirmation,
  address: string,
  accountName: string,
): Promise<void> {
  console.log(`Select deposit funding account ${accountName}`);
  await confirmation.clickFromAccountPill();

  const accountSelectModal = new AccountSelectModal(driver);
  await accountSelectModal.checkPageIsLoaded();
  await accountSelectModal.selectAccount(address);

  await confirmation.checkFromAccount(accountName);
}

/**
 * Pick the pay token from the wallet asset list via the pay-with pill and the
 * "Pay with" modal.
 *
 * @param driver - The WebDriver instance.
 * @param confirmation - The loaded deposit confirmation.
 * @param chainId - Hex chain id of the token, e.g. `0x1`.
 * @param symbol - Token symbol, e.g. `USDC`.
 */
export async function selectDepositPayToken(
  driver: Driver,
  confirmation: MoneyAccountDepositConfirmation,
  chainId: string,
  symbol: string,
): Promise<void> {
  console.log(`Select deposit pay token ${symbol} on ${chainId}`);
  await confirmation.clickPayWithPill();

  const payWithModal = new PayWithModal(driver);
  await payWithModal.checkPageIsLoaded();
  await payWithModal.openOtherAssets();
  await payWithModal.selectToken(chainId, symbol);

  await confirmation.checkPayWithToken(symbol);
}

/**
 * After confirming a deposit: verify the Money home shows the settled
 * "Converted" activity row and its details page reports Confirmed.
 *
 * @param driver - The WebDriver instance.
 * @param fiatAmount - Expected activity fiat amount, e.g. `+$50.00`.
 */
export async function verifyMoneyDepositConverted(
  driver: Driver,
  fiatAmount: string,
): Promise<void> {
  const moneyHomePage = new MoneyHomePage(driver);
  await moneyHomePage.checkPageIsLoaded();
  await moneyHomePage.checkConvertedActivity(fiatAmount);
  await moneyHomePage.clickActivityItem(tEn('moneyActivityConverted'));

  const detailsPage = new MoneyTransactionDetailsPage(driver);
  await detailsPage.checkPageIsLoaded();
  await detailsPage.checkStatusIsConfirmed();
}
