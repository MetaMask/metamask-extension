import { Driver } from '../../webdriver/driver';

export default class SettingsPage {
  private driver: Driver;

  constructor(driver: Driver) {
    this.driver = driver;
  }

  async navigateToSnaps(): Promise<void> {
    await this.driver.clickElement('[data-testid="account-options-menu-button"]');
    await this.driver.clickElement({ text: 'Snaps', tag: 'div' });
  }
}
