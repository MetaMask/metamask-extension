import { Driver } from '../webdriver/driver';

export class AccountMenu {
  constructor(private readonly driver: Driver) {}

  async openAccountMenu(): Promise<void> {
    await this.driver.clickElement('.account-menu__icon');
  }

  async switchToAccount(accountName: string): Promise<void> {
    await this.openAccountMenu();
    await this.driver.clickElement({ text: accountName, tag: 'div' });
  }

  async openActivityTab(): Promise<void> {
    await this.driver.clickElement({ text: 'Activity', tag: 'button' });
  }

  async getAccountBalance(): Promise<string> {
    const balanceElement = await this.driver.findElement('.currency-display-component__text');
    return await balanceElement.getText();
  }
}
