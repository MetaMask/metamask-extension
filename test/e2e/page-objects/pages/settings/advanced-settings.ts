import { Driver } from '../../../webdriver/driver';

class AdvancedSettings {
  private readonly driver: Driver;

  private readonly downloadDataButton = '[data-testid="export-data-button"]';

  private readonly downloadStateLogsButton =
    '[data-testid="advanced-setting-state-logs"]';

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
}

export default AdvancedSettings;
