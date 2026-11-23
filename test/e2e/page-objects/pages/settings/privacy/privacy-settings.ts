import { Driver } from '../../../../webdriver/driver';
import { THIRD_PARTY_APIS_ROUTE } from '../../../../../../ui/helpers/constants/routes';

/**
 * Settings → Privacy.
 *
 * Screen: `#/settings/privacy`, reached from `SettingsPage.goToPrivacySettings`.
 * Owns: MetaMetrics / marketing / basic functionality toggles, IPFS gateway,
 * Blockaid, export data and state logs, and navigation into the third-party
 * APIs sub-page.
 * Boundaries: not the Settings hub. The third-party APIs sub-page belongs to
 * `ThirdPartyApisSettings`; Security and password to
 * `SecurityAndPasswordSettings`. Onboarding privacy defaults belong to
 * `OnboardingPrivacySettingsPage`.
 * Related: `SettingsPage`, `ThirdPartyApisSettings`, `flows/settings.flow.ts`.
 *
 * @see ui/pages/settings/privacy-tab/privacy-tab.tsx
 */
class PrivacySettings {
  private readonly basicConfigurationCheckbox = {
    testId: 'basic-configuration-checkbox',
  };

  private readonly basicConfigurationModalToggleButton = {
    testId: 'basic-configuration-modal-toggle-button',
  };

  private readonly basicFunctionalityToggle =
    'label.toggle-button:has([data-testid="basic-functionality-toggle"])';

  private readonly basicFunctionalityToggleOff =
    '[data-testid="basic-functionality-toggle"][value="false"]';

  private readonly blockaidAlertsToggle =
    '[data-testid="securityAlert"] .toggle-button';

  private readonly confirmDeleteMetaMetricsDataButton =
    '[data-testid="clear-metametrics-data"]';

  private readonly dataCollectionForMarketingToggle =
    '[data-testid="data-collection-for-marketing-toggle"] .toggle-button';

  private readonly deleteMetaMetricsDataButton =
    '[data-testid="delete-metametrics-data-button"]';

  private readonly deleteMetaMetricsModalTitle = {
    text: 'Delete MetaMetrics data?',
    tag: 'h4',
  };

  private readonly downloadStateLogsButton =
    '[data-testid="advanced-setting-state-logs-button"]';

  private readonly downloadStateLogsModalButton =
    '[data-testid="download-state-logs-modal-button"]';

  private readonly downloadStateLogsModalRoot =
    '[data-testid="download-state-logs-modal"]';

  private readonly driver: Driver;

  private readonly exportYourDataButton =
    '[data-testid="privacy-tab-export-your-data-button"]';

  private readonly exportYourDataModalDownloadButton =
    '[data-testid="export-your-data-modal-download-button"]';

  private readonly ipfsGatewayToggle =
    '[data-testid="ipfsToggle"] .toggle-button';

  private readonly optedInToggle =
    '[data-testid="participate-in-meta-metrics-toggle"] .toggle-button';

  private readonly privacySettingsLoadedMarker = {
    xpath:
      "//label[contains(@class,'toggle-button')][.//*[@data-testid='basic-functionality-toggle']]",
  };

  private readonly settingsPage = {
    testId: 'parent-selector-settings-page',
  };

  /** Security alerts (Blockaid) live under Transactions in Settings, not Privacy. */
  private readonly settingsTransactionsTab =
    '[data-testid="settings-tab-item-transactions"]';

  private readonly thirdPartyApisSubpageLink = `a[href="#${THIRD_PARTY_APIS_ROUTE}"]`;

  constructor(driver: Driver) {
    this.driver = driver;
  }

  async checkBasicFunctionalityIsOff(): Promise<void> {
    console.log('Check basic functionality is off on privacy settings page');
    await this.driver.waitForSelector(this.basicFunctionalityToggleOff);
  }

  async checkPageIsLoaded(): Promise<void> {
    try {
      await this.driver.waitForMultipleSelectors([
        this.privacySettingsLoadedMarker,
        this.settingsPage,
      ]);
    } catch (e) {
      console.log(
        'Timeout while waiting for Privacy & Security Settings page to be loaded',
        e,
      );
      throw e;
    }
    console.log('Privacy & Security Settings page is loaded');
  }

  async deleteMetaMetrics(): Promise<void> {
    console.log('Click to delete MetaMetrics data on privacy settings page');
    await this.driver.clickElement(this.deleteMetaMetricsDataButton);
    await this.driver.waitForSelector(this.deleteMetaMetricsModalTitle);
    // there is a race condition, where we need to wait before clicking clear button otherwise an error is thrown in the background
    // we cannot wait for a UI conditon, so we a delay to mitigate this until another solution is found
    await this.driver.delay(3000);
    await this.driver.clickElementAndWaitToDisappear(
      this.confirmDeleteMetaMetricsDataButton,
    );
  }

  async downloadStateLogs(): Promise<void> {
    console.log('Downloading state logs on privacy settings page');
    await this.driver.findScrollToAndClickElement(this.downloadStateLogsButton);
    await this.driver.waitForSelector(this.downloadStateLogsModalRoot);
    await this.driver.waitForSelector(this.downloadStateLogsModalButton);
    await this.driver.clickElement(this.downloadStateLogsModalButton);
  }

  /**
   * Settings Privacy → Export your data: opens confirmation modal then downloads
   * the JSON backup (preferences, accounts, address book, networks) from `backupUserData`.
   */
  async exportYourData(): Promise<void> {
    console.log(
      'Exporting user data (account settings backup) on privacy settings page',
    );
    await this.driver.clickElement(this.exportYourDataButton);
    await this.driver.clickElement(this.exportYourDataModalDownloadButton);
  }

  async openThirdPartyApisSettings(): Promise<void> {
    console.log('Open Third-party APIs settings');
    await this.driver.clickElement(this.thirdPartyApisSubpageLink);
  }

  /**
   * Settings does not show the legacy “device only” popover when opting out;
   * this only toggles the control off.
   */
  async optOutDataCollectionForMarketing(): Promise<void> {
    console.log(
      'Opt out data collection for marketing on privacy settings page',
    );
    await this.toggleDataCollectionForMarketing({ targetState: 'off' });
  }

  async toggleBasicFunctionality(): Promise<void> {
    console.log('Toggle basic functionality on privacy settings page');
    await this.driver.clickElement(this.basicFunctionalityToggle);
  }

  async toggleBasicFunctionalityOff(): Promise<void> {
    console.log('Toggle basic functionality off on privacy settings page');
    await this.toggleBasicFunctionality();
    await this.driver.clickElement(this.basicConfigurationCheckbox);
    await this.driver.clickElement(this.basicConfigurationModalToggleButton);
  }

  async toggleBlockaidAlerts(): Promise<void> {
    console.log('Toggle blockaid alerts on privacy settings page');
    await this.driver.clickElement(this.settingsTransactionsTab);
    await this.driver.waitForSelector(this.blockaidAlertsToggle);
    await this.driver.clickElement(this.blockaidAlertsToggle);
  }

  async toggleDataCollectionForMarketing({
    targetState = 'on',
  }: { targetState?: 'on' | 'off' } = {}): Promise<void> {
    console.log(
      'Toggle data collection for marketing in Security and Privacy settings page',
    );
    await this.driver.clickElement(this.dataCollectionForMarketingToggle);
    await this.driver.waitForSelector(
      `${this.dataCollectionForMarketingToggle}.toggle-button--${targetState}`,
    );
  }

  async toggleIpfsGateway(): Promise<void> {
    console.log('Toggle IPFS gateway on privacy settings page');
    await this.driver.clickElement(this.ipfsGatewayToggle);
  }

  async toggleParticipateInMetaMetrics({
    targetState = 'on',
  }: { targetState?: 'on' | 'off' } = {}): Promise<void> {
    console.log(
      'Toggle participate in meta metrics in Security and Privacy settings page',
    );
    await this.driver.clickElement(this.optedInToggle);
    await this.driver.waitForSelector(
      `${this.optedInToggle}.toggle-button--${targetState}`,
    );
  }

  /**
   * Waits until the Delete MetaMetrics data button reaches the expected enabled/disabled state.
   * Prefer this over reading `isEnabled()` immediately to avoid flakes on slow CI.
   * @param expectedState
   */
  async waitForDeleteMetaMetricsDataButtonState(
    expectedState: 'enabled' | 'disabled',
  ): Promise<void> {
    await this.driver.waitForSelector(this.deleteMetaMetricsDataButton, {
      state: expectedState,
    });
  }
}

export default PrivacySettings;
