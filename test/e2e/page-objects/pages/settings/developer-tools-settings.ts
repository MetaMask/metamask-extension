import { Driver } from '../../../webdriver/driver';

/**
 * Settings → Developer tools.
 *
 * Screen: `#/settings/developer-tools`, reached from
 * `SettingsPage.goToDeveloperOptions`.
 * Owns: the show conversion on testnets toggle and deleting activity and
 * nonce data.
 * Boundaries: the developer tools tab only. The internal Debug tab belongs to
 * `DebugOptions`.
 * Related: `SettingsPage`, `DebugOptions`.
 *
 * @see ui/pages/settings/developer-tools-tab/developer-tools-tab.tsx
 */
class DeveloperToolsSettings {
  private readonly deleteActivityAndNonceConfirmButton =
    '[data-testid="delete-activity-and-nonce-data-button"]';

  private readonly deleteActivityAndNonceDataButton =
    '[data-testid="developer-options-delete-activity-and-nonce-data"]';

  private readonly deleteActivityAndNonceModal =
    '[data-testid="delete-activity-and-nonce-data-modal"]';

  private readonly driver: Driver;

  private readonly settingsPage = {
    testId: 'parent-selector-settings-page',
  };

  private readonly showFiatOnTestnetsToggleLabel = {
    xpath:
      "//label[contains(@class,'toggle-button')][.//*[@data-testid='developer-options-show-testnet-conversion-toggle']]",
  };

  constructor(driver: Driver) {
    this.driver = driver;
  }

  async checkPageIsLoaded(): Promise<void> {
    console.log('Check Developer tools settings page is loaded');
    await this.driver.waitForMultipleSelectors([
      this.showFiatOnTestnetsToggleLabel,
      this.settingsPage,
    ]);
  }

  async clickDeleteActivityAndNonceData(): Promise<void> {
    console.log('Click delete activity and nonce data');
    await this.driver.clickElement(this.deleteActivityAndNonceDataButton);
  }

  async confirmDeleteActivityAndNonceModal(): Promise<void> {
    console.log('Confirm delete activity and nonce data');
    await this.driver.waitForSelector(this.deleteActivityAndNonceModal);
    await this.driver.clickElementAndWaitToDisappear(
      this.deleteActivityAndNonceConfirmButton,
    );
  }

  async toggleShowFiatOnTestnets(): Promise<void> {
    console.log('Toggling Show Fiat on Testnets setting');
    await this.driver.clickElement(this.showFiatOnTestnetsToggleLabel);
  }
}

export default DeveloperToolsSettings;
