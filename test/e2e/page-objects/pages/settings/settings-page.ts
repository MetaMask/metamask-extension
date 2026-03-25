import { Driver } from '../../../webdriver/driver';

class SettingsPage {
  private readonly driver: Driver;

  private readonly aboutViewButton = {
    text: 'About MetaMask',
    css: '.tab-bar__tab__content__title',
  };

  private readonly closeSettingsPageButton =
    '[data-testid="settings-v2-header-back-button"]';

  private readonly backSettingsPageButton =
    '[data-testid="settings-v2-header-back-button"]';

  private readonly developerOptionsButton = {
    text: 'Debug',
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
    text: 'Privacy',
    css: '.tab-bar__tab__content__title',
  };

  private readonly securityAndPasswordSettingsButton =
    '[data-testid="settings-v2-tab-item-security-and-password"]';

  private readonly searchResultItem =
    '[data-testid="settings-v2-search-result-item"]';

  private readonly searchSettingsInput = '#search-settings';

  private readonly searchButton =
    '[data-testid="settings-v2-header-search-button"]';

  private readonly settingsPageRoot = '[data-testid="settings-v2-root"]';

  private readonly settingsPageFullscreenRoot =
    '[data-testid="settings-v2-tab-bar-grouped"]';

  private readonly notificationsSettingsButton = {
    text: 'Notifications',
    css: '.tab-bar__tab__content__title',
  };

  private readonly backupAndSyncSettingsButton = {
    text: 'Backup and sync',
    css: '.tab-bar__tab__content__title',
  };

  private readonly transactionShieldButton = {
    text: 'Transaction Shield',
    css: '.tab-bar__tab__content__title',
  };

  constructor(driver: Driver) {
    this.driver = driver;
  }

  async checkPageIsLoaded(): Promise<void> {
    console.log('Check settings page is loaded');
    await this.driver.waitForSelector(this.settingsPageFullscreenRoot);
  }

  async hasElement(
    locator: string | { css?: string; text?: string; tag?: string },
  ) {
    const elements = await this.driver.findElements(locator);
    return elements.length > 0;
  }

  async getCloseControl() {
    if (await this.hasElement(this.closeSettingsPageButton)) {
      return this.closeSettingsPageButton;
    }

    if (await this.hasElement(this.backSettingsPageButton)) {
      return this.backSettingsPageButton;
    }

    return '.settings-page__header__title-container__close-button';
  }

  async waitForTransactionShieldButtonReady(): Promise<void> {
    console.log('Waiting for Transaction Shield button to be ready');
    await this.driver.findClickableElement(this.transactionShieldButton);
    await this.driver.waitForElementToStopMoving(this.transactionShieldButton);
    console.log('Transaction Shield button is ready');
  }

  async goToTransactionShieldPage(): Promise<void> {
    console.log('Navigating to Transaction Shield page');
    await this.waitForTransactionShieldButtonReady();
    await this.driver.clickElement(this.transactionShieldButton);
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
    if (!(await this.hasElement(this.searchSettingsInput))) {
      await this.openSearch();
    }
    await this.driver.fill(this.searchSettingsInput, text);
  }

  async openSearch(): Promise<void> {
    console.log('Opening settings search');
    await this.driver.clickElement(this.searchButton);
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
    await this.closeSettingsPage();
  }

  async closeSettingsPage(): Promise<void> {
    console.log('Closing Settings page');
    await this.driver.clickElement(await this.getCloseControl());
  }

  async goToAboutPage(): Promise<void> {
    console.log('Navigating to About page');
    await this.driver.clickElement(this.aboutViewButton);
  }

  async goToDeveloperOptions(): Promise<void> {
    console.log('Navigating to Debug page');
    await this.driver.clickElement(this.developerOptionsButton);
  }

  async goToSecurityAndPasswordSettings(): Promise<void> {
    console.log('Navigating to Security and password page');
    await this.driver.clickElement(this.securityAndPasswordSettingsButton);
  }

  async goToExperimentalSettings(): Promise<void> {
    console.log('Navigating to Experimental Settings page');
    await this.driver.clickElement(this.experimentalSettingsButton);
  }

  async goToPrivacySettings(): Promise<void> {
    console.log('Navigating to Privacy Settings page');
    await this.driver.clickElement(this.privacySettingsButton);
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

  async checkNoMatchingResultsFoundMessageIsDisplayed(): Promise<void> {
    console.log(
      'Checking no matching results found message is displayed on settings page',
    );
    await this.driver.waitForSelector(this.noMatchingResultsFoundMessage);
  }
}

export default SettingsPage;
