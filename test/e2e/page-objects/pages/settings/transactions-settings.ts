import { Driver } from '../../../webdriver/driver';

/**
 * Settings → Transactions: hex data and security-alerts section.
 *
 * Screen: `#/settings/transactions`, reached from
 * `SettingsPage.goToTransactionsSettings`.
 * Owns: page load via hex-data toggle, toggling hex data on, and waiting for
 * the security alerts section.
 * Boundaries: transactions settings only. Smart-transactions / legacy advanced
 * helpers may still live on `AdvancedSettings`.
 * Related: `SettingsPage`, `AdvancedSettings`.
 *
 * @see ui/pages/settings/transactions-tab/transactions-tab.tsx
 */
export default class TransactionsSettingsPage {
  private readonly driver: Driver;

  private readonly hexDataToggle =
    '[data-testid="transactions-settings-hex-data-toggle"] .toggle-button';

  private readonly securityAlertSection = '[data-testid="securityAlert"]';

  constructor(driver: Driver) {
    this.driver = driver;
  }

  async checkPageIsLoaded(): Promise<void> {
    console.log('Check transactions settings page is loaded');
    await this.driver.waitForSelector(this.hexDataToggle);
  }

  async toggleOnHexData(): Promise<void> {
    console.log('Toggling on hex data in transactions settings');
    await this.driver.clickElement(this.hexDataToggle);
  }

  async waitForSecurityAlertsSection(): Promise<void> {
    await this.driver.waitForSelector(this.securityAlertSection);
  }
}
