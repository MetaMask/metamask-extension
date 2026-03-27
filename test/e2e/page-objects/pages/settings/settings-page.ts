import {
  ADVANCED_ROUTE,
  DEFAULT_ROUTE,
  SETTINGS_V2_ROUTE,
} from '../../../../../ui/helpers/constants/routes';
import HomePage from '../home/homepage';
import { Driver } from '../../../webdriver/driver';

class SettingsPage {
  private readonly driver: Driver;

  private readonly aboutViewButton =
    '[data-testid="settings-v2-tab-item-about-us"]';

  private readonly autoLockSettingsButton = '[data-testid="auto-lock-button"]';

  private readonly assetsSettingsButton =
    '[data-testid="settings-v2-tab-item-assets"]';

  private readonly backSettingsPageButton =
    '[data-testid="settings-v2-header-back-button"]';

  private readonly developerOptionsButton =
    '[data-testid="settings-v2-tab-item-debug"]';

  private readonly developerToolsSettingsButton =
    '[data-testid="settings-v2-tab-item-developer-options"]';

  private readonly experimentalSettingsButton =
    '[data-testid="settings-v2-tab-item-experimental"]';

  private readonly noMatchingResultsFoundMessage = {
    text: 'No matching results found.',
  };

  private readonly privacySettingsButton =
    '[data-testid="settings-v2-tab-item-privacy"]';

  private readonly securityAndPasswordSettingsButton =
    '[data-testid="settings-v2-tab-item-security-and-password"]';

  private readonly searchResultItem =
    '[data-testid="settings-v2-search-result-item"]';

  private readonly searchSettingsInput =
    '[data-testid="settings-v2-header-search-input"]';

  private readonly searchButton =
    '[data-testid="settings-v2-header-search-button"]';

  private readonly settingsPageRoot = '[data-testid="settings-v2-root"]';

  private readonly settingsPageFullscreenRoot =
    '[data-testid="settings-v2-tab-bar-grouped"]';

  private readonly notificationsSettingsButton =
    '[data-testid="settings-v2-tab-item-notifications"]';

  private readonly backupAndSyncSettingsButton =
    '[data-testid="settings-v2-tab-item-backup-and-sync"]';

  private readonly transactionsSettingsButton =
    '[data-testid="settings-v2-tab-item-transactions"]';

  private readonly transactionShieldButton =
    '[data-testid="settings-v2-tab-item-transaction-shield"]';

  constructor(driver: Driver) {
    this.driver = driver;
  }

  async checkPageIsLoaded(): Promise<void> {
    console.log('Check settings page is loaded');
    await this.driver.wait(async () => {
      return await this.isOnSettingsPage();
    });
  }

  async hasElement(
    locator: string | { css?: string; text?: string; tag?: string },
  ) {
    const elements = await this.driver.findElements(locator);
    return elements.length > 0;
  }

  async isOnSettingsPage() {
    return await this.hasElement(this.settingsPageFullscreenRoot);
  }

  async clickBackButton(): Promise<void> {
    await this.driver.executeScript(
      `window.location.hash = ${JSON.stringify(DEFAULT_ROUTE)};`,
    );
    await new HomePage(this.driver).checkPageIsLoaded();
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

  async goToAdvancedSettings(): Promise<void> {
    console.log('Navigating to Advanced Settings page');
    await this.driver.executeScript(
      `window.location.hash = ${JSON.stringify(ADVANCED_ROUTE)};`,
    );
  }

  async fillSearchSettingsInput(text: string): Promise<void> {
    console.log(`Filling search settings input with ${text}`);
    await this.openSearch();
    await this.driver.waitForSelector(this.searchSettingsInput);
    await this.driver.fill(this.searchSettingsInput, text);
  }

  async openSearch(): Promise<void> {
    console.log('Opening settings search');
    await this.driver.clickElement(this.searchButton);
    await this.driver.waitForSelector(this.searchSettingsInput);
    console.log('Search input is opened');
  }

  async toggleShowFiatOnTestnets(): Promise<void> {
    console.log('Toggling Show Fiat on Testnets setting');
    await this.driver.clickElement(
      '[data-testid="developer-options-show-testnet-conversion-toggle"]',
    );
  }

  async toggleBalanceSetting(): Promise<void> {
    console.log('Toggling balance setting');
    await this.driver.clickElement(
      '.toggle-button.show-native-token-as-main-balance',
    );
  }

  async goToAboutPage(): Promise<void> {
    console.log('Navigating to About page');
    await this.driver.clickElement(this.aboutViewButton);
  }

  async goToAssetsSettings(): Promise<void> {
    console.log('Navigating to Assets Settings page');
    await this.driver.clickElement(this.assetsSettingsButton);
  }

  async goToAutoLockSettings(): Promise<void> {
    console.log('Navigating to Auto-lock settings page');
    await this.driver.clickElement(this.autoLockSettingsButton);
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

  async goToTransactionsSettings(): Promise<void> {
    console.log('Navigating to Transactions Settings page');
    await this.driver.clickElement(this.transactionsSettingsButton);
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
