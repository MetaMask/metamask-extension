import { Driver } from '../../webdriver/driver';
import { getCleanAppState } from '../../helpers';
import ExtensionUpdateTakeover from '../pages/dialog/extension-update-takeover';
import HeaderNavbar from '../pages/home/header-navbar';
import PrivacySettings from '../pages/settings/privacy-settings';
import SettingsPage from '../pages/settings/settings-page';

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
