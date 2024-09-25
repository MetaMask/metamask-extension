import { Driver } from '../../webdriver/driver';


class SettingsPage {
  private readonly driver: Driver;

  // Locators
  private readonly experimentalSettingsButton: object = {
    text: 'Experimental',
    css: '.tab-bar__tab__content__title',
  };

  private readonly settingsPageTitle: object = {
    text: 'Settings',
    css: 'h3',
  };

  constructor(driver: Driver) {
    this.driver = driver;
  }

  async check_pageIsLoaded(): Promise<void> {
    try {
      await this.driver.waitForSelector(this.settingsPageTitle);
    } catch (e) {
      console.log('Timeout while waiting for Settings page to be loaded', e);
      throw e;
    }
    console.log('Settings page is loaded');
  }

  async goToExperimentalSettings(): Promise<void> {
    console.log('Navigating to Experimental Settings page');
    await this.driver.clickElement(this.experimentalSettingsButton);
  }
}

export default SettingsPage;
