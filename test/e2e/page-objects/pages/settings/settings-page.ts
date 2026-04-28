import HomePage from '../home/homepage';
import { Driver } from '../../../webdriver/driver';

class SettingsPage {
  private readonly driver: Driver;

  private readonly aboutViewButton =
    '[data-testid="settings-v2-tab-item-about-us"]';

  private readonly autoLockSettingsButton = '[data-testid="auto-lock-button"]';

  private readonly assetsSettingsButton =
    '[data-testid="settings-v2-tab-item-assets"]';

  private readonly developerToolsSettingsButton =
    '[data-testid="settings-v2-tab-item-developer-tools"]';

  /** Full internal developer options (crash, remote flags, etc.); see `debug-tab.tsx`. */
  private readonly debugSettingsButton =
    '[data-testid="settings-v2-tab-item-debug"]';

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

  private readonly showNativeTokenAsMainBalanceToggleLabel = {
    xpath:
      "//label[contains(@class,'toggle-button')][.//*[@data-testid='show-native-token-as-main-balance']]",
  };

  private readonly showFiatOnTestnetsToggleLabel = {
    xpath:
      "//label[contains(@class,'toggle-button')][.//*[@data-testid='developer-options-show-testnet-conversion-toggle']]",
  };

  private readonly transactionsSettingsButton =
    '[data-testid="settings-v2-tab-item-transactions"]';

  private readonly transactionShieldButton =
    '[data-testid="settings-v2-tab-item-transaction-shield"]';

  private readonly preinstalledExampleSnapSidebarItem = {
    text: 'Preinstalled Example Snap',
    tag: 'p',
  } as const;

  private readonly autoLockOptionsList =
    '[data-testid="auto-lock-options-list"]';

  private readonly autoLockOptionQuarterMinute =
    '[data-testid="auto-lock-option-0.25"]';

  private readonly developerOptionsDeleteActivityAndNonceData =
    '[data-testid="developer-options-delete-activity-and-nonce-data"]';

  private readonly deleteActivityAndNonceModal =
    '[data-testid="delete-activity-and-nonce-data-modal"]';

  private readonly deleteActivityAndNonceConfirmButton =
    '[data-testid="delete-activity-and-nonce-data-button"]';

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

  /**
   * Navigates to wallet home (`/` — same path as app `DEFAULT_ROUTE`) and
   * waits for the home page. Kept E2E-local to avoid importing `ui` routes.
   */
  async clickBackButton(): Promise<void> {
    await this.driver.executeScript(
      `window.location.hash = ${JSON.stringify('/')}`,
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

  /**
   * Legacy V1 "Advanced" tab does not exist in Settings V2. Uses Developer Tools
   * tab (closest surface for former advanced-style controls).
   */
  async goToAdvancedSettings(): Promise<void> {
    console.log('Navigating to Advanced Settings page (Developer Tools in V2)');
    await this.goToDeveloperOptions();
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
    await this.driver.waitForSelector(this.showFiatOnTestnetsToggleLabel);
    await this.driver.clickElement(this.showFiatOnTestnetsToggleLabel);
  }

  async goToPreInstalledExample(): Promise<void> {
    console.log('Navigating to Preinstalled Example Snap settings page');
    await this.driver.clickElement(this.preinstalledExampleSnapSidebarItem);
  }

  async waitForAutoLockOptionsList(): Promise<void> {
    await this.driver.waitForSelector(this.autoLockOptionsList);
  }

  async selectQuarterMinuteAutoLockOption(): Promise<void> {
    await this.driver.clickElement(this.autoLockOptionQuarterMinute);
  }

  async clickDeveloperOptionsDeleteActivityAndNonceData(): Promise<void> {
    await this.driver.clickElement(
      this.developerOptionsDeleteActivityAndNonceData,
    );
  }

  async confirmDeleteActivityAndNonceModal(): Promise<void> {
    await this.driver.waitForSelector(this.deleteActivityAndNonceModal);
    await this.driver.clickElementAndWaitToDisappear(
      this.deleteActivityAndNonceConfirmButton,
    );
  }

  async toggleBalanceSetting(): Promise<void> {
    console.log('Toggling balance setting');
    await this.goToAssetsSettings();
    await this.driver.waitForSelector(
      this.showNativeTokenAsMainBalanceToggleLabel,
    );
    await this.driver.clickElement(
      this.showNativeTokenAsMainBalanceToggleLabel,
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

  /**
   * Opens the Developer Tools tab (fiat on testnets, clear activity, etc.).
   */
  async goToDeveloperOptions(): Promise<void> {
    console.log('Navigating to Developer Tools page');
    await this.driver.clickElement(this.developerToolsSettingsButton);
  }

  /**
   * Opens the Debug tab, which embeds the legacy developer options page (crash
   * generator, remote feature flags display, etc.).
   */
  async goToDebugSettings(): Promise<void> {
    console.log('Navigating to Debug settings page');
    await this.driver.clickElement(this.debugSettingsButton);
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
