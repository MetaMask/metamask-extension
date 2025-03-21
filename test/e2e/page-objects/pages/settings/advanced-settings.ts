import { Key } from 'selenium-webdriver';
import { Driver } from '../../../webdriver/driver';

class AdvancedSettings {
  private readonly driver: Driver;

  private readonly downloadDataButton = '[data-testid="export-data-button"]';

  private readonly downloadStateLogsButton =
    '[data-testid="advanced-setting-state-logs"]';

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

  async toggleSmartTransactions(): Promise<void> {
    console.log('Toggling Smart Transactions setting');
    const stxToggle = await this.driver.findElement(
      this.smartTransactionsToggle,
    );
    stxToggle.sendKeys(Key.ENTER);
  }
}

export default AdvancedSettings;
