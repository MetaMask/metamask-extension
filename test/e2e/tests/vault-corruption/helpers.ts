import { WALLET_PASSWORD } from '../../constants';
import { type Driver } from '../../webdriver/driver';
import {
  completeCreateNewWalletOnboardingFlow,
  completeVaultRecoveryOnboardingFlow,
} from '../../page-objects/flows/onboarding.flow';
import HomePage from '../../page-objects/pages/home/homepage';
import HeaderNavbar from '../../page-objects/pages/header-navbar';
import AccountListPage from '../../page-objects/pages/account-list-page';
import AccountAddressModal from '../../page-objects/pages/multichain/account-address-modal';
import AddressListModal from '../../page-objects/pages/multichain/address-list-modal';
import LoginPage from '../../page-objects/pages/login-page';
import VaultRecoveryPage from '../../page-objects/pages/vault-recovery-page';

/**
 * Returns the config for database/vault corruption tests.
 *
 * @param title - The title of the test.
 * @param options - Additional options.
 * @param options.additionalIgnoredErrors - Additional console errors to ignore.
 * @param options.additionalManifestFlags - Additional manifest testing flags.
 * @returns The test configuration object.
 */
export function getConfig(
  title?: string,
  options: {
    additionalIgnoredErrors?: string[];
    additionalManifestFlags?: Record<string, unknown>;
  } = {},
) {
  const { additionalIgnoredErrors = [], additionalManifestFlags = {} } =
    options;

  return {
    title,
    ignoredConsoleErrors: [
      // Expected error caused by breaking the database:
      'PersistenceError: Data error: storage.local does not contain vault data',
      ...additionalIgnoredErrors,
    ],
    // This flag ultimately requires that we onboard manually, as we can't use
    // `fixtures` in this test, as the `ExtensionStore` class doesn't use them.
    manifestFlags: {
      testing: {
        forceExtensionStore: true,
        ...additionalManifestFlags,
      },
    },
  };
}

/**
 * Returns the first (truncated) address from the account list in UI.
 *
 * @param driver - The WebDriver instance.
 * @param headerNavbar
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
 * Onboard the user.
 *
 * @param driver - The WebDriver instance.
 */
export async function onboard(driver: Driver): Promise<void> {
  await completeCreateNewWalletOnboardingFlow({
    driver,
    password: WALLET_PASSWORD,
    skipSRPBackup: true,
  });
}

/**
 * Recovers the vault and returns the first account's address.
 *
 * @param driver - The WebDriver instance.
 */
export async function onboardAfterRecovery(driver: Driver): Promise<string> {
  // Log back in to the wallet and complete onboarding
  await completeVaultRecoveryOnboardingFlow({
    driver,
    password: WALLET_PASSWORD,
  });

  // now that we are re-onboarded, get the first account's address
  return await getFirstAddress(driver);
}

/**
 * Since reloading the background restarts the extension the UI isn't
 * available immediately. So we just keep reloading the UI until it is. This
 * is a bit of a hack, but I can't figure out a better way.
 *
 * @param driver - The WebDriver instance.
 */
async function waitForVaultRestorePage(driver: Driver): Promise<void> {
  const vaultRecoveryPage = new VaultRecoveryPage(driver);
  await vaultRecoveryPage.waitForPageAfterExtensionReload();
}

/**
 * Breaks the databases and then begins recovery. Only returns once the
 * background page has reloaded and the UI is available again.
 *
 * @param driver - The WebDriver instance.
 * @param script - The script to break the DB that will be executed in the
 * background page for MV2 or offscreen page for MV3.
 * @returns The initial first account's address.
 */
export async function onboardThenTriggerCorruption(
  driver: Driver,
  script: string,
): Promise<string> {
  const initialWindow = await driver.driver.getWindowHandle();

  // open a spare tab so the browser doesn't exit once we `reload()` the
  // extension process, as doing so will close all UI tabs we have open when
  // we do -- and that will close the whole browser 😱
  await driver.openNewPage('about:blank');

  await onboard(driver);

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
  await waitForVaultRestorePage(driver);

  return firstAddress;
}

/**
 * Click the recovery/reset button then confirm or dismiss the action.
 *
 * @param options - The options.
 * @param options.driver - The WebDriver instance.
 * @param options.confirm - Whether to confirm the action or not.
 */
export async function clickRecover({
  driver,
  confirm,
}: {
  driver: Driver;
  confirm: boolean;
}): Promise<void> {
  const vaultRecoveryPage = new VaultRecoveryPage(driver);
  await vaultRecoveryPage.clickRecoveryButton({ confirm });
}
