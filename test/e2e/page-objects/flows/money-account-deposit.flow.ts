import { tEn } from '../../../lib/i18n-helpers';
import type { Anvil } from '../../seeder/anvil';
import { Driver } from '../../webdriver/driver';
import { MoneyAccountDepositConfirmation } from '../pages/confirmations/money-account-deposit-confirmation';
import BottomNavBar from '../pages/home/bottom-nav-bar-page';
import MoneyFtueSplashPage from '../pages/money/money-ftue-splash-page';
import MoneyHomePage from '../pages/money/money-home-page';
import MoneyTransactionDetailsPage from '../pages/money/money-transaction-details-page';
import { login } from './login.flow';

/**
 * Open the Money home page via the bottom nav Money tab. Assumes the wallet
 * is already unlocked.
 *
 * @param driver - The WebDriver instance.
 * @returns The loaded `MoneyHomePage`.
 */
export async function openMoneyHome(driver: Driver): Promise<MoneyHomePage> {
  const bottomNavBar = new BottomNavBar(driver);
  await bottomNavBar.checkPageIsLoaded();
  await bottomNavBar.clickMoney();

  const moneyHomePage = new MoneyHomePage(driver);
  await moneyHomePage.checkPageIsLoaded();
  return moneyHomePage;
}

/**
 * Open the Money FTUE splash via the bottom nav Money tab. Assumes the wallet
 * is already unlocked.
 *
 * @param driver - The WebDriver instance.
 * @returns The loaded `MoneyFtueSplashPage`.
 */
export async function openMoneyFtueSplash(
  driver: Driver,
): Promise<MoneyFtueSplashPage> {
  const bottomNavBar = new BottomNavBar(driver);
  await bottomNavBar.checkPageIsLoaded();
  await bottomNavBar.clickMoney({ assertRoute: false });

  const splash = new MoneyFtueSplashPage(driver);
  await splash.checkPageIsLoaded();
  return splash;
}

/**
 * Unlock the wallet and open the Money home page via the bottom nav Money
 * tab.
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

  return openMoneyHome(driver);
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
 * The activity list and details screen are the Money home, not the shared Pay
 * confirmation. Pay token selection and the funding-account picker live on
 * `metamask-pay.flow.ts`.
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
