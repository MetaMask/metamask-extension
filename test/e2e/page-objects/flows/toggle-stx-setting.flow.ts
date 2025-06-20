import { Driver } from '../../webdriver/driver';
import AdvancedSettings from '../pages/settings/advanced-settings';
import HeaderNavbar from '../pages/header-navbar';
import SettingsPage from '../pages/settings/settings-page';

/**
 * Toggle the Smart Transactions (STX) option from the Advance settings.
 *
 * @param driver - The driver instance.
 */
export async function toggleStxSetting(driver: Driver) {
  const headerNavbar = new HeaderNavbar(driver);
  await headerNavbar.check_pageIsLoaded();
  await headerNavbar.openSettingsPage();

  const settingsPage = new SettingsPage(driver);
  await settingsPage.check_pageIsLoaded();
  await settingsPage.clickAdvancedTab();
  const advancedSettingsPage = new AdvancedSettings(driver);
  await advancedSettingsPage.check_pageIsLoaded();
  await advancedSettingsPage.toggleSmartTransactions();
  await settingsPage.closeSettingsPage();
}
