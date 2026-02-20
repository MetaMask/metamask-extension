import { WALLET_PASSWORD } from '../../constants';
import { type Driver } from '../../webdriver/driver';
import HomePage from '../pages/home/homepage';
import HeaderNavbar from '../pages/header-navbar';
import AccountListPage from '../pages/account-list-page';
import AccountAddressModal from '../pages/multichain/account-address-modal';
import AddressListModal from '../pages/multichain/address-list-modal';
import LoginPage from '../pages/login-page';
import CriticalErrorPage from '../pages/critical-error-page';
import VaultRecoveryPage from '../pages/vault-recovery-page';
import { completeCreateNewWalletOnboardingFlow } from './onboarding.flow';

/**
 * Returns the first (truncated) address from the account list in UI.
 *
 * @param driver - The WebDriver instance.
 * @param headerNavbar - Optional HeaderNavbar instance to reuse.
 * @returns The first account's address.
 */
export async function getFirstAddress(
  driver: Driver,
  headerNavbar: HeaderNavbar = new HeaderNavbar(driver),
): Promise<string> {
  await headerNavbar.checkPageIsLoaded();
  await headerNavbar.openAccountMenu();

  const accountListPage = new AccountListPage(driver);
  await accountListPage.checkPageIsLoaded(20000);
  await accountListPage.openMultichainAccountMenu({
    accountLabel: 'Account 1',
  });

  await accountListPage.clickMultichainAccountMenuItem('Addresses');

  const addressListModal = new AddressListModal(driver);
  await addressListModal.clickQRbutton();

  const accountAddressModal = new AccountAddressModal(driver);
  const accountAddress = await accountAddressModal.getAccountAddress();
  await accountAddressModal.goBack();
  await addressListModal.goBack();
  await accountListPage.closeMultichainAccountsPage();

  return accountAddress;
}

/**
 * Simple script that reloads the extension.
 * Used when manifest flags (e.g. simulateStorageGetFailure, simulateBackgroundInitializationHang)
 * handle the simulation after backup exists.
 */
export const simpleReloadScript = `
  const callback = arguments[arguments.length - 1];
  const browser = globalThis.browser ?? globalThis.chrome;
  browser.runtime.reload();
  callback();
`;

/**
 * Onboards a new wallet, then executes a script.
 *
 * This flow:
 * 1. Opens a spare tab (to prevent browser from closing when extension reloads)
 * 2. Completes new wallet onboarding
 * 3. Gets the first account's address
 * 4. Locks the wallet
 * 5. Executes the corruption script
 * 6. Waits for the vault recovery page to appear
 *
 * @param driver - The WebDriver instance.
 * @param script - The script to run (e.g. corruption script, or simpleReloadScript).
 * @param options - Additional options.
 * @param options.participateInMetaMetrics - Whether to participate in MetaMetrics. Defaults to false.
 * @returns The initial first account's address (before the script ran).
 */
export async function onboardThenExecuteScript(
  driver: Driver,
  script: string,
  {
    participateInMetaMetrics = false,
  }: {
    participateInMetaMetrics?: boolean;
  } = {},
): Promise<string> {
  const initialWindow = await driver.driver.getWindowHandle();

  // open a spare tab so the browser doesn't exit once we `reload()` the
  // extension process, as doing so will close all UI tabs we have open when
  // we do -- and that will close the whole browser 😱
  await driver.openNewPage('about:blank');

  await completeCreateNewWalletOnboardingFlow({
    driver,
    password: WALLET_PASSWORD,
    participateInMetaMetrics,
    skipSRPBackup: true,
  });

  const homePage = new HomePage(driver);
  await homePage.checkPageIsLoaded();
  await homePage.waitForLoadingOverlayToDisappear();

  const headerNavbar = new HeaderNavbar(driver);
  const firstAddress = await getFirstAddress(driver, headerNavbar);
  await headerNavbar.lockMetaMask();
  const loginPage = new LoginPage(driver);
  await loginPage.checkPageIsLoaded();

  // use the home page to destroy the vault
  await driver.executeAsyncScript(script);

  // the previous tab we were using is now closed, so we need to tell Selenium
  // to switch back to the other page (required for Chrome)
  await driver.switchToWindow(initialWindow);

  // get a new tab ready to use (required for Firefox)
  await driver.openNewPage('about:blank');

  return firstAddress;
}

/**
 * Onboards a new wallet, then triggers database corruption.
 *
 * Flow:
 * 1. Opens a spare tab (to prevent browser from closing when extension reloads)
 * 2. Completes new wallet onboarding
 * 3. Calls onboardThenExecuteScript to get address, lock, run script, switch back
 * 4. Waits for the vault recovery page to appear
 *
 * @param driver - The WebDriver instance.
 * @param script - The script to break the DB (or simpleReloadScript when manifest flags handle it).
 * @param options - Additional options.
 * @param options.participateInMetaMetrics - Whether to participate in MetaMetrics. Defaults to false.
 * @returns The initial first account's address (before corruption).
 */
export async function onboardThenTriggerCorruptionFlow(
  driver: Driver,
  script: string,
  {
    participateInMetaMetrics = false,
  }: {
    participateInMetaMetrics?: boolean;
  } = {},
): Promise<string> {
  const firstAddress = await onboardThenExecuteScript(driver, script, {
    participateInMetaMetrics,
  });

  // wait for the background page to reload
  // Since reloading the background restarts the extension the UI isn't
  // available immediately. So we just keep reloading the UI until it is.
  const vaultRecoveryPage = new VaultRecoveryPage(driver);
  await vaultRecoveryPage.waitForPageAfterExtensionReload();

  return firstAddress;
}

/**
 * Onboards a new wallet, then triggers init or state sync timeout (when backup exists).
 *
 * Flow: onboard → onboardThenExecuteScript(simpleReloadScript) → wait for critical error page.
 *
 * @param driver - The WebDriver instance.
 * @param options - Additional options.
 * @param options.timeoutMs - How long to wait for the critical error page (must allow for
 * phase timeouts: init ~31s, state sync ~47s). Default 60s.
 * @returns The initial first account's address (before reload).
 */
export async function onboardThenTriggerTimeOutFlow(
  driver: Driver,
  { timeoutMs = 60_000 } = {},
): Promise<string> {
  const firstAddress = await onboardThenExecuteScript(
    driver,
    simpleReloadScript,
  );

  const criticalErrorPage = new CriticalErrorPage(driver);
  await criticalErrorPage.waitForPageAfterExtensionReload({
    timeoutMs,
    waitForLoadingLogoToDisappear: false,
  });

  // Init/state-sync timeout shows a ~15s loading spinner before the critical error
  await criticalErrorPage.checkPageIsLoaded(20000);

  return firstAddress;
}
