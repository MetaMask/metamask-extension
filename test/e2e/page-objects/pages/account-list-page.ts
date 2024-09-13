import { Driver } from '../../webdriver/driver';

class AccountListPage {
  private readonly driver: Driver;

  constructor(driver: Driver) {
    this.driver = driver;
  }

  async openAccountOptions(): Promise<void> {
    await this.driver.clickElement('[data-testid="account-options-menu-button"]');
  }

  async hideAccount(): Promise<void> {
    await this.driver.clickElement('[data-testid="account-options-menu__hide-account"]');
  }

  async assertHiddenAccountsListExists(): Promise<void> {
    await this.driver.waitForSelector('[data-testid="hidden-accounts-list"]');
  }

  async openHiddenAccountsList(): Promise<void> {
    await this.driver.clickElement('[data-testid="hidden-accounts-list"]');
  }

  async openHiddenAccountOptions(): Promise<void> {
    await this.driver.clickElement('[data-testid="hidden-account-options-menu-button"]');
  }

  async unhideAccount(): Promise<void> {
    await this.driver.clickElement('[data-testid="account-options-menu__unhide-account"]');
  }

  async assertAccountExists(): Promise<void> {
    await this.driver.waitForSelector('[data-testid="account-menu-item"]');
  }
}

export default AccountListPage;
