import { Key } from 'selenium-webdriver';
import { Driver } from '../../../webdriver/driver';

class AdvancedSettings {
  private readonly driver: Driver;

  private readonly downloadDataButton = '[data-testid="export-data-button"]';

  private readonly downloadStateLogsButton =
    '[data-testid="advanced-setting-state-logs-button"]';

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

  private readonly fullSizeViewToggle =
    '[data-testid="advanced-setting-show-extension-in-full-size-view"] .toggle-button > div';

  private readonly showConversionOnTestnetsToggle =
    '.show-fiat-on-testnets-toggle';

  private readonly smartTransactionsToggle =
    '[data-testid="settings-page-stx-opt-in-toggle"]';

  constructor(driver: Driver) {
    this.driver = driver;
  }

  async check_pageIsLoaded(): Promise<void> {
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
    console.log('Clicking clear activity tab data button in advanced settings');
    await this.driver.clickElement(this.clearActivityTabDataButton);
    await this.driver.waitForSelector(this.clearActivityMessage);
    await this.driver.clickElementAndWaitToDisappear(
      this.confirmClearActivityButton,
    );
  }

  async downloadData(): Promise<void> {
    console.log('Downloading data on advanced settings page');
    await this.driver.clickElement(this.downloadDataButton);
  }

  async downloadStateLogs(): Promise<void> {
    console.log('Downloading state logs on advanced settings page');
    await this.driver.clickElement(this.downloadStateLogsButton);
  }

  async toggleFullSizeViewSetting(): Promise<void> {
    console.log('Toggling full size view setting in advanced settings');
    await this.driver.clickElement(this.fullSizeViewToggle);
  }

  async toggleShowConversionOnTestnets(): Promise<void> {
    console.log('Toggling show conversion on testnets in advanced settings');
    await this.driver.clickElement(this.showConversionOnTestnetsToggle);
  }

  async toggleSmartTransactions(): Promise<void> {
    console.log('Toggling Smart Transactions setting');
    const stxToggle = await this.driver.findElement(
      this.smartTransactionsToggle,
    );
    stxToggle.sendKeys(Key.ENTER);
  }
}

export default AdvancedSettings;
