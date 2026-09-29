import { tEn } from '../../../lib/i18n-helpers';
import type { Anvil } from '../../seeder/anvil';
import { Driver } from '../../webdriver/driver';
import { MoneyAccountDepositConfirmation } from '../pages/confirmations/money-account-deposit-confirmation';
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
