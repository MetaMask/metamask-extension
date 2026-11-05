import { WINDOW_TITLES } from '../../constants';
import { Driver } from '../../webdriver/driver';
import { getCleanAppState } from '../../helpers';
import ExtensionUpdateTakeover from '../pages/dialog/extension-update-takeover';
import PersonalSignConfirmation from '../pages/confirmations/personal-sign-confirmation';
import TransactionConfirmation from '../pages/confirmations/transaction-confirmation';
import HeaderNavbar from '../pages/home/header-navbar';
import PrivacySettings from '../pages/settings/privacy-settings';
import SettingsPage from '../pages/settings/settings-page';
import TestDapp from '../pages/test-dapp';

export type DappConfirmationType = 'signature' | 'transaction';

/**
 * Opens an extension page in a new tab and waits for the takeover there.
 *
 * @param driver - The webdriver instance.
 * @param page - Extension HTML entry point.
 * @param route - Optional hash route, for example `#settings`.
 * @returns The new tab's window handle.
 */
export async function openTakeoverInNewExtensionTab(
  driver: Driver,
  page: 'home' | 'popup',
  route = '',
): Promise<string> {
  const handle = await driver.openNewPage(
    `${driver.extensionUrl}/${page}.html${route}`,
  );
  await new ExtensionUpdateTakeover(driver).checkPageIsLoaded();
  return handle;
}

/**
 * From the home page, opens Settings > Privacy and starts toggling basic
 * functionality so its confirmation modal is open.
 *
 * @param driver - The webdriver instance.
 */
export async function openBasicFunctionalityModal(
  driver: Driver,
): Promise<void> {
  await new HeaderNavbar(driver).openSettingsPage();
  const settingsPage = new SettingsPage(driver);
  await settingsPage.checkPageIsLoaded();
  await settingsPage.goToPrivacySettings();
  const privacySettings = new PrivacySettings(driver);
  await privacySettings.checkPageIsLoaded();
  await privacySettings.toggleBasicFunctionality();
  await privacySettings.checkBasicFunctionalityModalIsDisplayed();
}

/**
 * Waits until a remote feature flag value has reached the UI state.
 *
 * @param driver - The webdriver instance.
 * @param name - Remote feature flag name.
 * @param value - Expected flag value.
 */
export async function waitForRemoteFeatureFlag(
  driver: Driver,
  name: string,
  value: unknown,
): Promise<void> {
  await driver.waitUntil(
    async () => {
      const uiState = await getCleanAppState(driver);
      return uiState?.metamask?.remoteFeatureFlags?.[name] === value;
    },
    { interval: 500, timeout: driver.timeout },
  );
}

/**
 * Triggers a dapp request from the test dapp and switches to the notification
 * window it opens.
 *
 * @param driver - The webdriver instance.
 * @param type - Personal sign or a simple send transaction.
 * @returns The test dapp's window handle.
 */
export async function requestDappConfirmation(
  driver: Driver,
  type: DappConfirmationType,
): Promise<string> {
  const testDapp = new TestDapp(driver);
  await testDapp.openTestDappPage();
  await testDapp.checkPageIsLoaded();
  const dappHandle = await driver.getCurrentWindowHandle();
  if (type === 'signature') {
    await testDapp.clickPersonalSign();
  } else {
    await testDapp.clickSimpleSendButton();
  }
  await driver.waitForWindowWithTitleToBePresent(WINDOW_TITLES.Dialog);
  await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
  return dappHandle;
}

/**
 * After Update from a notification window, checks the test dapp received a
 * user-rejected response for the personal sign it requested.
 *
 * Switches windows through WebDriver handles. The extension reload drops the
 * background socket that `switchToWindowWithTitle` uses.
 *
 * @param driver - The webdriver instance. It may be focused on the updating tab.
 */
export async function checkPersonalSignWasRejected(
  driver: Driver,
): Promise<void> {
  let dappHandle = '';
  await driver.wait(async () => {
    for (const handle of await driver.driver.getAllWindowHandles()) {
      try {
        await driver.driver.switchTo().window(handle);
        if ((await driver.driver.getTitle()) === WINDOW_TITLES.TestDApp) {
          dappHandle = handle;
          return true;
        }
      } catch {
        // Windows close while the extension reloads.
      }
    }
    return false;
  });
  await driver.driver.switchTo().window(dappHandle);
  await driver.waitForSelector({
    css: '#personalSign',
    text: 'Error: User rejected the request.',
  });
}

/**
 * Checks the pending confirmation is rendered and still actionable by
 * rejecting it and verifying the test dapp receives the rejection.
 *
 * @param driver - The webdriver instance, focused on the notification window.
 * @param type - The confirmation type requested by `requestDappConfirmation`.
 */
export async function rejectDappConfirmation(
  driver: Driver,
  type: DappConfirmationType,
): Promise<void> {
  if (type === 'signature') {
    const confirmation = new PersonalSignConfirmation(driver);
    await confirmation.checkPageIsLoaded();
    await confirmation.verifyConfirmationHeadingTitle();
    await confirmation.clickFooterButton({
      button: 'cancel',
      waitUntil: 'windowClose',
    });
    await checkPersonalSignWasRejected(driver);
    return;
  }
  const confirmation = new TransactionConfirmation(driver);
  await confirmation.checkPageIsLoaded();
  await confirmation.clickFooterButton({
    button: 'cancel',
    waitUntil: 'windowClose',
  });
}
