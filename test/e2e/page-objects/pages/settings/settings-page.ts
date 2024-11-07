import { Driver } from '../../../webdriver/driver';

class SettingsPage {
  private readonly driver: Driver;

  private readonly closeSettingsPageButton =
    '.settings-page__header__title-container__close-button';

  // Locators
  private readonly experimentalSettingsButton = {
    text: 'Experimental',
    css: '.tab-bar__tab__content__title',
  };

  private readonly privacySettingsButton = {
    text: 'Security & privacy',
    css: '.tab-bar__tab__content__title',
  };

  private readonly settingsPageTitle = {
    text: 'Settings',
    css: 'h3',
  };

  constructor(driver: Driver) {
    this.driver = driver;
  }

  async closeSettingsPage(): Promise<void> {
    console.log('Closing Settings page');
    await this.driver.clickElement(this.closeSettingsPageButton);
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

  async goToPrivacySettings(): Promise<void> {
    console.log('Navigating to Privacy & Security Settings page');
    await this.driver.clickElement(this.privacySettingsButton);
  }
}

export default SettingsPage;
