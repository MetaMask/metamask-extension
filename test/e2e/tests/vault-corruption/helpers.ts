import { until } from 'selenium-webdriver';
import { WALLET_PASSWORD, WINDOW_TITLES } from '../../constants';
import { PAGES, type Driver } from '../../webdriver/driver';
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
  await driver.waitUntil(
    async () => {
      await driver.navigate(PAGES.HOME, { waitForControllers: false });
      const title = await driver.driver.getTitle();
      // the browser will return an error message for our UI's HOME page until
      // the extension has restarted
      return title === WINDOW_TITLES.ExtensionInFullScreenView;
    },
    // reload and check title as quickly a possible
    { interval: 100, timeout: 10000 },
  );
  await driver.assertElementNotPresent('.loading-logo', { timeout: 10000 });
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
  // click the Recovery/Reset button
  await driver.waitForSelector('#critical-error-button');
  await driver.clickElement('#critical-error-button');

  // Wait for the confirmation alert to appear and handle it immediately
  await driver.driver.wait(until.alertIsPresent(), 20000);
  const alert = await driver.driver.switchTo().alert();
  if (confirm) {
    await alert.accept();
  } else {
    await alert.dismiss();
  }

  if (confirm) {
    // delay needed to mitigate a race condition where the tab is closed and re-opened after confirming, causing to window to become stale
    await driver.delay(3000);
    try {
      await driver.switchToWindowWithTitle(
        WINDOW_TITLES.ExtensionInFullScreenView,
      );
    } catch {
      // to mitigate a race condition where the tab is closed after confirming (issue #36916)
      await driver.openNewPage('about:blank');
      await driver.navigate();
    }
    // the button should be disabled if the user confirmed the prompt, but given this is a transient state that goes very fast
    // it can cause a race condition where the element becomes stale, so we check directly that the element is not present as that's a stable state that occurs eventually
    await driver.assertElementNotPresent('#critical-error-button');
  } else {
    // the button should be enabled if the user dismissed the prompt
    // Wait for UI to settle after dismissing the alert
    await driver.waitForSelector('#critical-error-button');
  }
}
