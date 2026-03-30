import { Driver } from '../../webdriver/driver';
import HomePage from '../pages/home/homepage';
import SettingsPage from '../pages/settings/settings-page';
import PreferencesAndDisplaySettings from '../pages/settings/preferences-and-display-settings';
import SelectNetwork from '../pages/dialog/select-network';

/**
 * Enable test networks (testnets) from Settings → Networks (opens the network
 * list menu; toggles “Show test networks”).
 *
 * @param driver - The WebDriver instance
 */
export const enableTestNetworks = async (driver: Driver): Promise<void> => {
  const homePage = new HomePage(driver);
  await homePage.checkPageIsLoaded();

  await homePage.headerNavbar.openSettingsPage();

  const settingsPage = new SettingsPage(driver);
  await settingsPage.checkPageIsLoaded();
  await settingsPage.goToNetworksSettings();

  const selectNetworkDialog = new SelectNetwork(driver);
  await selectNetworkDialog.checkPageIsLoaded();
  await selectNetworkDialog.toggleShowTestNetwork();
  await selectNetworkDialog.clickCloseButton();

  await settingsPage.clickBackButton();
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

  await settingsPage.clickBackButton();
};
