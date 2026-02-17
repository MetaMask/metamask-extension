import { Driver } from '../../webdriver/driver';
import HomePage from '../pages/home/homepage';
import SettingsPage from '../pages/settings/settings-page';
import GeneralSettings from '../pages/settings/general-settings';
import AdvancedSettings from '../pages/settings/advanced-settings';
import ContactsSettings from '../pages/settings/contacts-settings';

/**
 * Enable test networks (testnets) from settings
 *
 * @param driver - The WebDriver instance
 */
export const enableTestNetworks = async (driver: Driver): Promise<void> => {
  const homePage = new HomePage(driver);
  await homePage.headerNavbar.openSettingsPage();

  const settingsPage = new SettingsPage(driver);
  await settingsPage.clickAdvancedTab();

  const advancedSettings = new AdvancedSettings(driver);
  await advancedSettings.checkPageIsLoaded();
  await advancedSettings.toggleShowTestnets();
  await settingsPage.closeSettingsPage();
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

  const generalSettings = new GeneralSettings(driver);
  await generalSettings.checkPageIsLoaded();
  await generalSettings.toggleShowNativeTokenAsMainBalance();

  const settingsPage = new SettingsPage(driver);
  await settingsPage.closeSettingsPage();
};

/**
 * Add a contact to the address book via Settings > Contacts.
 *
 * @param driver - The WebDriver instance
 * @param contactName - Display name for the contact
 * @param address - Ethereum address of the contact
 */
export const addAddressBookContact = async (
  driver: Driver,
  contactName: string,
  address: string,
): Promise<void> => {
  const homePage = new HomePage(driver);
  await homePage.headerNavbar.openSettingsPage();

  const settingsPage = new SettingsPage(driver);
  await settingsPage.checkPageIsLoaded();
  await settingsPage.goToContactsSettings();

  const contactsSettings = new ContactsSettings(driver);
  await contactsSettings.checkPageIsLoaded();
  await contactsSettings.addContact(contactName, address);

  await settingsPage.closeSettingsPage();
};
