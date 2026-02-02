import { WALLET_PASSWORD } from '../../constants';
import { type Driver } from '../../webdriver/driver';
import HomePage from '../pages/home/homepage';
import HeaderNavbar from '../pages/header-navbar';
import AccountListPage from '../pages/account-list-page';
import AccountAddressModal from '../pages/multichain/account-address-modal';
import AddressListModal from '../pages/multichain/address-list-modal';
import LoginPage from '../pages/login-page';
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
  await headerNavbar.openAccountMenu();

  const accountListPage = new AccountListPage(driver);
  await accountListPage.checkPageIsLoaded();
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
 * Onboards a new wallet, then triggers database corruption.
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
 * @param script - The script to break the DB that will be executed in the
 * background page for MV2 or offscreen page for MV3.
 * @returns The initial first account's address (before corruption).
 */
export async function onboardThenTriggerCorruptionFlow(
  driver: Driver,
  script: string,
): Promise<string> {
  const initialWindow = await driver.driver.getWindowHandle();

  // open a spare tab so the browser doesn't exit once we `reload()` the
  // extension process, as doing so will close all UI tabs we have open when
  // we do -- and that will close the whole browser 😱
  await driver.openNewPage('about:blank');

  await completeCreateNewWalletOnboardingFlow({
    driver,
    password: WALLET_PASSWORD,
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

  // wait for the background page to reload
  // Since reloading the background restarts the extension the UI isn't
  // available immediately. So we just keep reloading the UI until it is.
  const vaultRecoveryPage = new VaultRecoveryPage(driver);
  await vaultRecoveryPage.waitForPageAfterExtensionReload();

  return firstAddress;
}
