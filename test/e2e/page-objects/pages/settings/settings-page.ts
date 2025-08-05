import { Driver } from '../../../webdriver/driver';

class SettingsPage {
  private readonly driver: Driver;

  private readonly aboutViewButton = {
    text: 'About',
    css: '.tab-bar__tab__content__title',
  };

  private readonly closeSettingsPageButton =
    '.settings-page__header__title-container__close-button';

  private readonly contactsButton = {
    text: 'Contacts',
    css: '.tab-bar__tab__content__title',
  };

  private readonly developerOptionsButton = {
    text: 'Developer Options',
    css: '.tab-bar__tab__content__title',
  };

  private readonly experimentalSettingsButton = {
    text: 'Experimental',
    css: '.tab-bar__tab__content__title',
  };

  private readonly noMatchingResultsFoundMessage = {
    text: 'No matching results found',
    tag: 'span',
  };

  private readonly privacySettingsButton = {
    text: 'Security & privacy',
    css: '.tab-bar__tab__content__title',
  };

  private readonly preInstalledExampleButton = {
    text: 'Preinstalled Example Snap',
    css: '.tab-bar__tab__content__title',
  };

  private readonly searchResultItem =
    '.settings-page__header__search__list__item__tab';

  private readonly searchSettingsInput = '#search-settings';

  private readonly settingsPageTitle = {
    text: 'Settings',
    css: 'h3',
  };

  private readonly notificationsSettingsButton = {
    text: 'Notifications',
    css: '.tab-bar__tab__content__title',
  };

  private readonly backupAndSyncSettingsButton = {
    text: 'Backup and sync',
    css: '.tab-bar__tab__content__title',
  };

  constructor(driver: Driver) {
    this.driver = driver;
  }

  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  async check_pageIsLoaded(): Promise<void> {
    console.log('Check settings page is loaded');
    await this.driver.waitForSelector(this.settingsPageTitle);
  }

  async clickAdvancedTab(): Promise<void> {
    console.log('Clicking on Advanced tab');
    await this.driver.clickElement({
      css: '.tab-bar__tab__content__title',
      text: 'Advanced',
    });
  }

  async fillSearchSettingsInput(text: string): Promise<void> {
    console.log(`Filling search settings input with ${text}`);
    await this.driver.fill(this.searchSettingsInput, text);
  }

  async goToContactsSettings(): Promise<void> {
    console.log('Navigating to Contacts page settings');
    await this.driver.clickElement(this.contactsButton);
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

  async goToAboutPage(): Promise<void> {
    console.log('Navigating to About page');
    await this.driver.clickElement(this.aboutViewButton);
  }

  async goToDeveloperOptions(): Promise<void> {
    console.log('Navigating to Developer Options page');
    await this.driver.clickElement(this.developerOptionsButton);
  }

  async goToExperimentalSettings(): Promise<void> {
    console.log('Navigating to Experimental Settings page');
    await this.driver.clickElement(this.experimentalSettingsButton);
  }

  async goToPrivacySettings(): Promise<void> {
    console.log('Navigating to Privacy Settings page');
    await this.driver.clickElement(this.privacySettingsButton);
  }

  async goToPreInstalledExample(): Promise<void> {
    console.log('Navigating to Preinstalled Example Snap settings page');
    await this.driver.clickElement(this.preInstalledExampleButton);
  }

  async goToNotificationsSettings(): Promise<void> {
    console.log('Navigating to Notifications Settings page');
    await this.driver.clickElement(this.notificationsSettingsButton);
  }

  async goToBackupAndSyncSettings(): Promise<void> {
    console.log('Navigating to Backup & Sync Settings page');
    await this.driver.clickElement(this.backupAndSyncSettingsButton);
  }

  async goToSearchResultPage(page: string): Promise<void> {
    console.log(`Navigating to ${page} settings page from search results`);
    await this.driver.clickElement({
      css: this.searchResultItem,
      text: page,
    });
  }

  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  async check_noMatchingResultsFoundMessageIsDisplayed(): Promise<void> {
    console.log(
      'Checking no matching results found message is displayed on settings page',
    );
    await this.driver.waitForSelector(this.noMatchingResultsFoundMessage);
  }
}

export default SettingsPage;
