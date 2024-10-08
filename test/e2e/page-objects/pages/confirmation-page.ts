import { Driver } from '../../webdriver/driver';

export default class ConfirmationPage {
  private readonly driver: Driver;

  constructor(driver: Driver) {
    this.driver = driver;
  }

  async clickConfirmButton(): Promise<void> {
    await this.driver.clickElement({ text: 'Confirm', tag: 'button' });
  }

  async clickRejectButton(): Promise<void> {
    await this.driver.clickElement({ text: 'Reject', tag: 'button' });
  }

  async waitForConfirmationPage(): Promise<void> {
    await this.driver.waitForSelector({ text: 'Confirmation', tag: 'h2' });
  }
}
