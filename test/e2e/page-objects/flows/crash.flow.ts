import { Driver } from '../../webdriver/driver';
import HeaderNavbar from '../pages/header-navbar';
import SettingsPage from '../pages/settings/settings-page';
import DebugPage from '../pages/debug-page';

/**
 * Trigger a UI crash.
 *
 * @param driver
 */
export const triggerCrash = async (driver: Driver): Promise<void> => {
  const headerNavbar = new HeaderNavbar(driver);
  await headerNavbar.openSettingsPage();
  const settingsPage = new SettingsPage(driver);
  await settingsPage.checkPageIsLoaded();
  await settingsPage.goToDebugSettings();

  const debugPage = new DebugPage(driver);
  await debugPage.checkPageIsLoaded();
  await debugPage.clickGenerateCrashButton();
};
