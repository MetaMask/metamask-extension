import { Driver } from '../webdriver/driver';

export class TransactionConfirmation {
  constructor(private readonly driver: Driver) {}

  async confirmTransaction(): Promise<void> {
    await this.driver.clickElement({ text: 'Confirm', tag: 'button' });
  }

  async rejectTransaction(): Promise<void> {
    await this.driver.clickElement({ text: 'Reject', tag: 'button' });
  }

  async waitForTransactionResult(): Promise<void> {
    await this.driver.waitForSelector({
      css: '.transaction-status--confirmed',
      text: 'Transaction complete',
    });
  }
}
