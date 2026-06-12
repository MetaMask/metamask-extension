import { Driver } from '../../../webdriver/driver';

export default class TransactionsSettingsPage {
  private readonly driver: Driver;

  private readonly hexDataToggle =
    '[data-testid="transactions-settings-hex-data-toggle"] .toggle-button';

  private readonly securityAlertSection = '[data-testid="securityAlert"]';

  constructor(driver: Driver) {
    this.driver = driver;
  }

  async waitForSecurityAlertsSection(): Promise<void> {
    await this.driver.waitForSelector(this.securityAlertSection);
  }

  async checkPageIsLoaded(): Promise<void> {
    console.log('Check transactions settings page is loaded');
    await this.driver.waitForSelector(this.hexDataToggle);
  }

  async toggleOnHexData(): Promise<void> {
    console.log('Toggling on hex data in transactions settings');
    await this.driver.clickElement(this.hexDataToggle);
  }
}
