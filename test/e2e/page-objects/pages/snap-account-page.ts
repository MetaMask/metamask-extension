import { Driver } from '../../webdriver/driver';

export default class SnapAccountPage {
  private readonly driver: Driver;

  constructor(driver: Driver) {
    this.driver = driver;
  }

  async clickAccountMenuIcon(): Promise<void> {
    await this.driver.clickElement('[data-testid="account-menu-icon"]');
  }

  async findAccountBalance(balance: string): Promise<void> {
    await this.driver.findElement(`[title="${balance} ETH"]`);
  }

  async clickActivityTab(): Promise<void> {
    await this.driver.clickElement('[data-testid="activity-tab"]');
  }

  async findRejectedTransaction(): Promise<void> {
    await this.driver.findElement(
      '[data-original-title="Request rejected by user or snap."]'
    );
  }
}
