import { Driver } from '../../webdriver/driver';

export class TransactionListPage {
  private driver: Driver;

  constructor(driver: Driver) {
    this.driver = driver;
  }

  async goToActivityTab() {
    await this.driver.clickElement(
      '[data-testid="account-overview__activity-tab"]',
    );
  }

  async waitForPendingTransaction() {
    await this.driver.waitForSelector('.transaction-status-label--pending');
  }

  async clickPendingTransaction() {
    await this.driver.clickElement('.transaction-list-item');
  }

  async waitForTransactionStatus(status: 'confirmed' | 'cancelled') {
    await this.driver.waitForSelector(`.transaction-status-label--${status}`, {
      timeout: 5000,
    });
  }

  async cancelTransaction() {
    await this.driver.clickElement({ text: 'Cancel', tag: 'button' });
    await this.driver.clickElement({ text: 'Submit', tag: 'button' });
  }
}
