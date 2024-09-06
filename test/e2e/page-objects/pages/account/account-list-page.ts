import { Driver } from '../../../webdriver/driver';

export class AccountListPage {
  private readonly driver: Driver;

  // Locators
  private readonly accountMenuIconSelector = '[data-testid="account-menu-icon"]';
  private readonly createAccountButtonSelector = '[data-testid="multichain-account-menu-popover-action-button"]';
  private readonly addAccountButtonSelector = '[data-testid="multichain-account-menu-popover-add-account"]';
  private readonly accountNameInputSelector = '[placeholder="Account 2"]';
  private readonly addAccountConfirmButtonSelector = 'button';
  private readonly accountItemSelector = '.multichain-account-list-item .multichain-account-list-item__account-name__button';

  constructor(driver: Driver) {
    this.driver = driver;
  }

  async createAccount(accountName: string): Promise<void> {
    console.log(`Creating new account: ${accountName}`);
    await this.driver.clickElement(this.accountMenuIconSelector);
    await this.driver.clickElement(this.createAccountButtonSelector);
    await this.driver.clickElement(this.addAccountButtonSelector);
    await this.driver.fill(this.accountNameInputSelector, accountName);
    await this.driver.clickElement({ text: 'Create', tag: this.addAccountConfirmButtonSelector });
    console.log(`Account created: ${accountName}`);
  }

  async switchToAccount(accountName: string): Promise<void> {
    console.log(`Switching to account: ${accountName}`);
    await this.driver.clickElement(this.accountMenuIconSelector);
    await this.driver.clickElement({
      css: this.accountItemSelector,
      text: accountName,
    });
    console.log(`Switched to account: ${accountName}`);
  }

  async check_accountExists(accountName: string): Promise<boolean> {
    console.log(`Checking if account exists: ${accountName}`);
    await this.driver.clickElement(this.accountMenuIconSelector);
    const accountExists = await this.driver.isElementPresent({
      css: this.accountItemSelector,
      text: accountName,
    });
    await this.driver.clickElement(this.accountMenuIconSelector); // Close the menu
    console.log(`Account ${accountName} exists: ${accountExists}`);
    return accountExists;
  }
}

export default AccountListPage;
