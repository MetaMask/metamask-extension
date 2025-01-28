import { Driver } from '../../../webdriver/driver';

class SettingsPage {
  private readonly driver: Driver;

  private readonly closeSettingsPageButton =
    '.settings-page__header__title-container__close-button';

  private readonly developerOptionsButton = {
    text: 'Developer Options',
    css: '.tab-bar__tab__content__title',
  };

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

  async check_pageIsLoaded(): Promise<void> {
    try {
      await this.driver.waitForSelector(this.settingsPageTitle);
    } catch (e) {
      console.log('Timeout while waiting for Settings page to be loaded', e);
      throw e;
    }
    console.log('Settings page is loaded');
  }

  async clickAdvancedTab(): Promise<void> {
    console.log('Clicking on Advanced tab');
    await this.driver.clickElement({
      css: '.tab-bar__tab__content__title',
      text: 'Advanced',
    });
  }

  async toggleShowFiatOnTestnets(): Promise<void> {
    console.log('Toggling Show Fiat on Testnets setting');
    await this.driver.clickElement(
      '.toggle-button.show-fiat-on-testnets-toggle',
    );
  }

  async toggleBalanceSetting(): Promise<void> {
    console.log('Toggling balance setting');
    await this.driver.clickElement(
      '.toggle-button.show-native-token-as-main-balance',
    );
  }

  async exitSettings(): Promise<void> {
    console.log('Exiting settings page');
    await this.driver.clickElement(
      '.settings-page__header__title-container__close-button',
    );
  }

  async closeSettingsPage(): Promise<void> {
    console.log('Closing Settings page');
    await this.driver.clickElement(this.closeSettingsPageButton);
  }

  async goToDevelopOptionSettings(): Promise<void> {
    console.log('Navigating to Develop options page');
    await this.driver.clickElement(this.developerOptionsButton);
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
