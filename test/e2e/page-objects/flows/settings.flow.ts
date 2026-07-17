import { Driver } from '../../webdriver/driver';
import HomePage from '../pages/home/homepage';
import SettingsPage from '../pages/settings/settings-page';
import PreferencesAndDisplaySettings from '../pages/settings/preferences-and-display-settings';
import SelectNetwork from '../pages/dialog/select-network';
import HeaderNavbar from '../pages/header-navbar';
import PrivacySettings from '../pages/settings/privacy-settings';
import ChangePasswordPage from '../pages/settings/change-password-page';
import { lockAndWaitForLoginPage } from './login.flow';

/**
 * Close the Settings page and return to the wallet home.
 *
 * Clicking the Settings back button returns to home with the account drawer
 * still open, so this also closes the drawer via the navbar back button.
 *
 * @param driver - The WebDriver instance
 */
export const closeSettings = async (driver: Driver): Promise<void> => {
  const settingsPage = new SettingsPage(driver);
  await settingsPage.closeSettings();

  const headerNavbar = new HeaderNavbar(driver);
  await headerNavbar.clickDrawerBackButton();
};

/**
 * Enable test networks (testnets) from Settings → Networks (opens the network
 * list menu; toggles "Show test networks").
 *
 * @param driver - The WebDriver instance
 */
export const enableTestNetworks = async (driver: Driver): Promise<void> => {
  const headerNavbar = new HeaderNavbar(driver);
  const homePage = new HomePage(driver);
  await headerNavbar.openGlobalNetworksMenu();

  const selectNetworkDialog = new SelectNetwork(driver);
  await selectNetworkDialog.checkPageIsLoaded();
  await selectNetworkDialog.toggleShowTestNetwork();
  await selectNetworkDialog.clickCloseButton();
  await homePage.headerNavbar.clickDrawerBackButton();
};

/**
 * Enable native token as main balance from settings
 *
 * @param driver - The WebDriver instance
 */
export const enableNativeTokenAsMainBalance = async (
  driver: Driver,
): Promise<void> => {
  const homePage = new HomePage(driver);
  await homePage.headerNavbar.openSettingsPage();

  const settingsPage = new SettingsPage(driver);
  await settingsPage.checkPageIsLoaded();
  await settingsPage.goToAssetsSettings();

  const assetsSettings = new PreferencesAndDisplaySettings(driver);
  await assetsSettings.checkAssetsPageIsLoaded();
  await assetsSettings.toggleShowNativeTokenAsMainBalance();

  await closeSettings(driver);
};

export async function navigateToSecurityAndPassword(
  driver: Driver,
): Promise<void> {
  const headerNavbar = new HeaderNavbar(driver);
  await headerNavbar.openSettingsPage();
  const settingsPage = new SettingsPage(driver);
  await settingsPage.checkPageIsLoaded();
  await settingsPage.goToSecurityAndPasswordSettings();
  const privacySettings = new PrivacySettings(driver);
  await privacySettings.checkSecurityAndPasswordPageIsLoaded();
}

/**
 * Change the wallet password from Settings → Security & Privacy, then lock the
 * wallet and wait for the login page.
 *
 * @param driver - The WebDriver instance
 * @param currentPassword - The current wallet password
 * @param newPassword - The new wallet password
 * @param isSocialLogin - Whether the user is a social login user (shows an
 * additional password change warning that must be confirmed)
 */
export async function changePasswordAndLockWallet(
  driver: Driver,
  currentPassword: string,
  newPassword: string,
  isSocialLogin: boolean = false,
): Promise<void> {
  await navigateToSecurityAndPassword(driver);

  const privacySettings = new PrivacySettings(driver);
  await privacySettings.openChangePassword();

  const changePasswordPage = new ChangePasswordPage(driver);
  await changePasswordPage.checkPageIsLoaded();

  await changePasswordPage.confirmCurrentPassword(currentPassword);

  await changePasswordPage.changePassword(newPassword);
  if (isSocialLogin) {
    await changePasswordPage.checkPasswordChangedWarning();
    await changePasswordPage.confirmChangePasswordWarning();
  }

  // Password change triggers an async vault re-encryption. No UI element
  // reliably signals completion, so a brief delay avoids navigating away
  // before the new password is persisted.
  await driver.delay(2_000);

  await closeSettings(driver);

  await lockAndWaitForLoginPage(driver);
}
