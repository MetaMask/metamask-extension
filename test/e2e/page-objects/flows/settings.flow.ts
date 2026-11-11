import { Driver } from '../../webdriver/driver';
import HomePage from '../pages/home/homepage';
import SettingsPage from '../pages/settings/settings-page';
import AssetsSettings from '../pages/settings/assets-settings';
import LanguageSettings from '../pages/settings/preferences-and-display/language-settings';
import ManageWalletRecoverySettings from '../pages/settings/security-and-password/manage-wallet-recovery-settings';
import PreferencesAndDisplaySettings from '../pages/settings/preferences-and-display/preferences-and-display-settings';
import NetworksPage from '../pages/networks/networks-page';
import HeaderNavbar from '../pages/home/header-navbar';
import RevealSrpPage from '../pages/reveal-srp-page';
import SecurityAndPasswordSettings from '../pages/settings/security-and-password/security-and-password-settings';
import ChangePasswordPage from '../pages/settings/security-and-password/change-password-page';
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
  await headerNavbar.openGlobalNetworksMenu();

  const networksPage = new NetworksPage(driver);
  await networksPage.checkPageIsLoaded();
  await networksPage.toggleShowTestNetwork();
  await networksPage.clickCloseButton();
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

  const assetsSettings = new AssetsSettings(driver);
  await assetsSettings.checkPageIsLoaded();
  await assetsSettings.toggleShowNativeTokenAsMainBalance();

  await closeSettings(driver);
};

/**
 * Change the language from Settings → Preferences and display → Language.
 * Expects Settings to be open.
 *
 * @param driver - The WebDriver instance
 * @param language - The language name as shown in the list, e.g. 'Dansk'
 */
export async function changeLanguage(
  driver: Driver,
  language: string,
): Promise<void> {
  await new PreferencesAndDisplaySettings(driver).openLanguageSettings();
  const languageSettings = new LanguageSettings(driver);
  await languageSettings.checkPageIsLoaded();
  await languageSettings.selectLanguage(language);
}

export async function navigateToSecurityAndPassword(
  driver: Driver,
): Promise<void> {
  const headerNavbar = new HeaderNavbar(driver);
  await headerNavbar.openSettingsPage();
  const settingsPage = new SettingsPage(driver);
  await settingsPage.checkPageIsLoaded();
  await settingsPage.goToSecurityAndPasswordSettings();
  const securityAndPasswordSettings = new SecurityAndPasswordSettings(driver);
  await securityAndPasswordSettings.checkPageIsLoaded();
}

/**
 * Open the reveal page for a Secret Recovery Phrase, from Settings → Security
 * and password through the SRP list. Expects Security and password to be open.
 *
 * @param driver - The WebDriver instance
 * @param srpIndex - The 1-based index of the Secret Recovery Phrase
 */
export async function openRevealSrp(
  driver: Driver,
  srpIndex: number = 1,
): Promise<void> {
  await new SecurityAndPasswordSettings(driver).openManageWalletRecovery();
  const manageWalletRecoverySettings = new ManageWalletRecoverySettings(driver);
  await manageWalletRecoverySettings.checkPageIsLoaded();
  await manageWalletRecoverySettings.selectSrp(srpIndex);
  await new RevealSrpPage(driver).checkPageIsLoaded();
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

  await new SecurityAndPasswordSettings(driver).openChangePassword();

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
