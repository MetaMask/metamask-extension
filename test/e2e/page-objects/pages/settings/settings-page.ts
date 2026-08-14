import { Driver } from '../../../webdriver/driver';

/**
 * Settings hub: search, tab navigation, and a few in-hub toggles/actions.
 *
 * Screen: `#/settings`, usually opened from `HeaderNavbar.openSettingsPage`.
 * Owns: settings search, navigation into child tabs (privacy, assets,
 * developer tools, notifications, Transaction Shield, etc.), auto-lock entry,
 * and closing settings back toward home.
 * Boundaries: the hub and its nav only. Once a child tab or sub-page opens,
 * that page object takes over (e.g. `PrivacySettings`,
 * `PreferencesAndDisplaySettings`, `ShieldDetailPage`).
 * Related: child page objects under `pages/settings/`;
 * `flows/settings.flow.ts` for common journeys.
 *
 * @see ui/pages/settings/settings.tsx
 * @see ui/pages/settings/tab-bar.tsx
 */
class SettingsPage {
  private readonly aboutViewButton =
    '[data-testid="settings-tab-item-about-us"]';

  private readonly assetsSettingsButton =
    '[data-testid="settings-tab-item-assets"]';

  private readonly autoLockOptionQuarterMinute =
    '[data-testid="auto-lock-option-0.25"]';

  private readonly autoLockOptionsList =
    '[data-testid="auto-lock-options-list"]';

  private readonly autoLockSettingsButton = '[data-testid="auto-lock-button"]';

  private readonly backButton = {
    testId: 'page-header-back-button',
  };

  private readonly backupAndSyncSettingsButton =
    '[data-testid="settings-tab-item-backup-and-sync"]';

  /** Full internal developer options (crash, remote flags, etc.); see `debug-tab.tsx`. */
  private readonly debugSettingsButton =
    '[data-testid="settings-tab-item-debug"]';

  private readonly deleteActivityAndNonceConfirmButton =
    '[data-testid="delete-activity-and-nonce-data-button"]';

  private readonly deleteActivityAndNonceModal =
    '[data-testid="delete-activity-and-nonce-data-modal"]';

  private readonly developerOptionsDeleteActivityAndNonceData =
    '[data-testid="developer-options-delete-activity-and-nonce-data"]';

  private readonly developerToolsSettingsButton =
    '[data-testid="settings-tab-item-developer-tools"]';

  private readonly driver: Driver;

  private readonly experimentalSettingsButton =
    '[data-testid="settings-tab-item-experimental"]';

  private readonly noMatchingResultsFoundMessage = {
    text: 'No matching results found.',
  };

  private readonly notificationsSettingsButton =
    '[data-testid="settings-tab-item-notifications"]';

  private readonly preinstalledExampleSnapSidebarItem = {
    text: 'Preinstalled Example Snap',
    tag: 'p',
  } as const;

  private readonly privacySettingsButton =
    '[data-testid="settings-tab-item-privacy"]';

  private readonly searchButton = '[data-testid="page-header-search-button"]';

  private readonly searchResultItem =
    '[data-testid="settings-search-result-item"]';

  private readonly searchSettingsInput =
    '[data-testid="page-header-search-input"]';

  private readonly securityAndPasswordSettingsButton =
    '[data-testid="settings-tab-item-security-and-password"]';

  private readonly settingsPageFullscreenRoot =
    '[data-testid="settings-tab-bar-grouped"]';

  private readonly showFiatOnTestnetsToggleLabel = {
    xpath:
      "//label[contains(@class,'toggle-button')][.//*[@data-testid='developer-options-show-testnet-conversion-toggle']]",
  };

  private readonly showNativeTokenAsMainBalanceToggleLabel = {
    xpath:
      "//label[contains(@class,'toggle-button')][.//*[@data-testid='show-native-token-as-main-balance']]",
  };

  private readonly syncAccountsSettingsButton =
    '[data-testid="settings-tab-item-sync-accounts"]';

  private readonly transactionShieldButton =
    '[data-testid="settings-tab-item-transaction-shield"]';

  private readonly transactionsSettingsButton =
    '[data-testid="settings-tab-item-transactions"]';

  constructor(driver: Driver) {
    this.driver = driver;
  }

  async checkNoMatchingResultsFoundMessageIsDisplayed(): Promise<void> {
    console.log(
      'Checking no matching results found message is displayed on settings page',
    );
    await this.driver.waitForSelector(this.noMatchingResultsFoundMessage);
  }

  async checkPageIsLoaded(): Promise<void> {
    console.log('Check settings page is loaded');
    await this.driver.waitForSelector(this.settingsPageFullscreenRoot);
  }

  /**
   * Click the Settings back button once. The back button only navigates one
   * level up, so a single click may not fully close Settings when on a nested
   * page. Use closeSettings to fully exit the Settings page.
   */
  async clickBackButton(): Promise<void> {
    await this.driver.clickElementSafe(this.backButton);
  }

  async clickDeveloperOptionsDeleteActivityAndNonceData(): Promise<void> {
    await this.driver.clickElement(
      this.developerOptionsDeleteActivityAndNonceData,
    );
  }

  /**
   * Close the Settings page and return to the wallet home with the navbar open.
   *
   * The back button only navigates one level up, so when we are on a nested
   * settings page (e.g. not Preferences) it must be clicked several times to
   * fully close Settings. Click it while we are still on a Settings page, up to
   * a few times, stopping as soon as we have left it.
   */
  async closeSettings(): Promise<void> {
    const maxAttempts = 5;
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      if (!(await this.isOnSettingsPage())) {
        return;
      }
      await this.clickBackButton();
      await this.driver.delay(1000);
    }
  }

  async confirmDeleteActivityAndNonceModal(): Promise<void> {
    await this.driver.waitForSelector(this.deleteActivityAndNonceModal);
    await this.driver.clickElementAndWaitToDisappear(
      this.deleteActivityAndNonceConfirmButton,
    );
  }

  async fillSearchSettingsInput(text: string): Promise<void> {
    console.log(`Filling search settings input with ${text}`);
    await this.openSearch();
    await this.driver.waitForSelector(this.searchSettingsInput);
    await this.driver.fill(this.searchSettingsInput, text);
  }

  async goToAboutPage(): Promise<void> {
    console.log('Navigating to About page');
    await this.driver.clickElement(this.aboutViewButton);
  }

  /**
   * Legacy V1 "Advanced" tab does not exist in Settings V2. Uses Developer Tools
   * tab (closest surface for former advanced-style controls).
   */
  async goToAdvancedSettings(): Promise<void> {
    console.log('Navigating to Advanced Settings page (Developer Tools in V2)');
    await this.goToDeveloperOptions();
  }

  async goToAssetsSettings(): Promise<void> {
    console.log('Navigating to Assets Settings page');
    await this.driver.clickElement(this.assetsSettingsButton);
  }

  async goToAutoLockSettings(): Promise<void> {
    console.log('Navigating to Auto-lock settings page');
    await this.driver.clickElement(this.autoLockSettingsButton);
  }

  async goToBackupAndSyncSettings(): Promise<void> {
    console.log('Navigating to Backup & Sync Settings page');
    await this.driver.clickElement(this.backupAndSyncSettingsButton);
  }

  /**
   * Opens the Debug tab, which embeds the legacy developer options page (crash
   * generator, remote feature flags display, etc.).
   */
  async goToDebugSettings(): Promise<void> {
    console.log('Navigating to Debug settings page');
    await this.driver.clickElement(this.debugSettingsButton);
  }

  /**
   * Opens the Developer Tools tab (fiat on testnets, clear activity, etc.).
   */
  async goToDeveloperOptions(): Promise<void> {
    console.log('Navigating to Developer Tools page');
    await this.driver.clickElement(this.developerToolsSettingsButton);
  }

  async goToExperimentalSettings(): Promise<void> {
    console.log('Navigating to Experimental Settings page');
    await this.driver.clickElement(this.experimentalSettingsButton);
  }

  async goToNotificationsSettings(): Promise<void> {
    console.log('Navigating to Notifications Settings page');
    await this.driver.clickElement(this.notificationsSettingsButton);
  }

  async goToPreInstalledExample(): Promise<void> {
    console.log('Navigating to Preinstalled Example Snap settings page');
    await this.driver.clickElement(this.preinstalledExampleSnapSidebarItem);
  }

  async goToPrivacySettings(): Promise<void> {
    console.log('Navigating to Privacy Settings page');
    await this.driver.clickElement(this.privacySettingsButton);
  }

  async goToSearchResultPage(page: string): Promise<void> {
    console.log(`Navigating to ${page} settings page from search results`);
    await this.driver.clickElement({
      css: this.searchResultItem,
      text: page,
    });
  }

  async goToSecurityAndPasswordSettings(): Promise<void> {
    console.log('Navigating to Security and password page');
    await this.driver.clickElement(this.securityAndPasswordSettingsButton);
  }

  async goToSyncAccountsSettings(): Promise<void> {
    await this.driver.clickElement(this.syncAccountsSettingsButton);
  }

  async goToTransactionShieldPage(): Promise<void> {
    console.log('Navigating to Transaction Shield page');
    await this.waitForTransactionShieldButtonReady();
    await this.driver.clickElement(this.transactionShieldButton);
  }

  async goToTransactionsSettings(): Promise<void> {
    console.log('Navigating to Transactions Settings page');
    await this.driver.clickElement(this.transactionsSettingsButton);
  }

  async isOnSettingsPage(): Promise<boolean> {
    const currentUrl = await this.driver.getCurrentUrl();
    return currentUrl.includes('settings');
  }

  async openSearch(): Promise<void> {
    console.log('Opening settings search');
    await this.driver.clickElement(this.searchButton);
    await this.driver.waitForSelector(this.searchSettingsInput);
    console.log('Search input is opened');
  }

  async selectQuarterMinuteAutoLockOption(): Promise<void> {
    await this.driver.clickElement(this.autoLockOptionQuarterMinute);
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

  async toggleShowFiatOnTestnets(): Promise<void> {
    console.log('Toggling Show Fiat on Testnets setting');
    await this.driver.waitForSelector(this.showFiatOnTestnetsToggleLabel);
    await this.driver.clickElement(this.showFiatOnTestnetsToggleLabel);
  }

  async waitForAutoLockOptionsList(): Promise<void> {
    await this.driver.waitForSelector(this.autoLockOptionsList);
  }

  async waitForTransactionShieldButtonReady(): Promise<void> {
    console.log('Waiting for Transaction Shield button to be ready');
    await this.driver.findClickableElement(this.transactionShieldButton);
    await this.driver.waitForElementToStopMoving(this.transactionShieldButton);
    console.log('Transaction Shield button is ready');
  }
}

export default SettingsPage;
