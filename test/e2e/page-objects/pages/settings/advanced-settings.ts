import { Key } from 'selenium-webdriver';
import { Driver } from '../../../webdriver/driver';

/**
 * Legacy “Advanced” settings helpers (auto-lock, state logs, hex data, STX).
 *
 * Screen: Settings V2 has no Advanced tab; tests reach the closest surface via
 * `SettingsPage.goToAdvancedSettings` → `#/settings/developer-tools`. Some
 * locators still target controls that now live on other tabs.
 * Owns: auto-lock timeout input, clear activity data, download state logs /
 * export data, show-testnets / fiat-on-testnets toggles, hex-data and smart
 * transactions toggles when present.
 * Boundaries: not the Settings hub. Prefer `TransactionsSettingsPage`,
 * `PrivacySettings`, or `SettingsPage` for controls that moved in V2.
 * Related: `SettingsPage` (navigation), `TransactionsSettingsPage`,
 * `PrivacySettings`.
 *
 * @see ui/pages/settings/developer-tools-tab/developer-tools-tab.tsx
 */
class AdvancedSettings {
  private readonly autoLockoutButton = {
    testId: 'auto-lockout-button',
  };

  private readonly autoLockoutTimeHelperText = '#autoTimeout-helper-text';

  private readonly autoLockoutTimeInput = {
    testId: 'auto-lockout-time',
  };

  private readonly clearActivityMessage = {
    text: 'Clear activity and nonce data?',
    css: '.modal-content__title',
  };

  private readonly clearActivityTabDataButton = {
    text: 'Clear activity tab data',
    tag: 'button',
  };

  private readonly confirmClearActivityButton = {
    text: 'Clear',
    tag: 'button',
  };

  private readonly downloadDataButton = '[data-testid="export-data-button"]';

  private readonly downloadStateLogsButton =
    '[data-testid="advanced-setting-state-logs-button"]';

  private readonly driver: Driver;

  private readonly hexDataToggle = {
    testId: 'transactions-show-hex-data-toggle',
  };

  private readonly showConversionOnTestnetsToggle = {
    xpath:
      "//label[contains(@class,'toggle-button')][.//*[@data-testid='developer-options-show-testnet-conversion-toggle']]",
  };

  private readonly showTestnetsToggle =
    '[data-testid="advanced-setting-show-testnets"] .toggle-button';

  private readonly smartTransactionsToggle =
    '[data-testid="settings-page-stx-opt-in-toggle"]';

  constructor(driver: Driver) {
    this.driver = driver;
  }

  async checkPageIsLoaded(): Promise<void> {
    try {
      await this.driver.waitForMultipleSelectors([
        this.downloadStateLogsButton,
        this.downloadDataButton,
      ]);
    } catch (e) {
      console.log(
        'Timeout while waiting for Advanced Settings page to be loaded',
        e,
      );
      throw e;
    }
    console.log('Advanced Settings page is loaded');
  }

  async clearActivityTabData(): Promise<void> {
    console.log('Clearing activity tab data from advanced settings page');
    await this.driver.clickElement(this.clearActivityTabDataButton);
    await this.driver.waitForSelector(this.clearActivityMessage);
    await this.driver.clickElementAndWaitToDisappear(
      this.confirmClearActivityButton,
    );
  }

  async confirmAutoLockout(): Promise<void> {
    console.log('Confirming auto lockout in advanced settings');
    await this.driver.clickElement(this.autoLockoutButton);
  }

  async downloadData(): Promise<void> {
    console.log('Downloading data on advanced settings page');
    await this.driver.clickElement(this.downloadDataButton);
  }

  async downloadStateLogs(): Promise<void> {
    console.log('Downloading state logs on advanced settings page');
    await this.driver.clickElement(this.downloadStateLogsButton);
  }

  /**
   * Fill the auto lockout time input with the given time in minutes
   *
   * @param time - The time in minutes to set the auto lockout time to
   * @param errorMessage - The error message to check for if expected
   */
  async fillAutoLockoutTime(
    time: string,
    errorMessage?: string,
  ): Promise<void> {
    console.log('Filling auto lockout time in advanced settings');
    await this.driver.fill(this.autoLockoutTimeInput, time);
    if (errorMessage) {
      await this.driver.waitForSelector({
        css: this.autoLockoutTimeHelperText,
        text: errorMessage,
      });
    } else {
      await this.driver.assertElementNotPresent(
        this.autoLockoutTimeHelperText,
        {
          waitAtLeastGuard: 100, // A findElementGuard is not possible here, because only this element changes, but a waitAtLeast of 100ms should be sufficient
        },
      );
    }
  }

  async toggleOnHexData(): Promise<void> {
    console.log('Toggling on hex data in advanced settings');
    await this.driver.clickElement(this.hexDataToggle);
  }

  async toggleShowConversionOnTestnets(): Promise<void> {
    console.log('Toggling show conversion on testnets in advanced settings');
    await this.driver.clickElement(this.showConversionOnTestnetsToggle);
  }

  async toggleShowTestnets(): Promise<void> {
    console.log('Toggling show testnets in advanced settings');
    await this.driver.clickElement(this.showTestnetsToggle);
  }

  async toggleSmartTransactions(): Promise<void> {
    console.log('Toggling Smart Transactions setting');
    const stxToggle = await this.driver.findElement(
      this.smartTransactionsToggle,
    );
    stxToggle.sendKeys(Key.ENTER);
  }

  async toggleSmartTransactionsOff(): Promise<void> {
    try {
      const stxToggle = await this.driver.findElement(
        this.smartTransactionsToggle,
      );
      await this.driver.findNestedElement(stxToggle, { text: 'On' });

      await this.toggleSmartTransactions();
      console.log('Smart transactions have been disabled');
    } catch (e) {
      console.log('Smart transactions are already disabled');
    }
  }
}

export default AdvancedSettings;
