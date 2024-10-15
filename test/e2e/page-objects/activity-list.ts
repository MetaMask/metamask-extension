import { Driver } from '../webdriver/driver';

export class ActivityList {
  constructor(private readonly driver: Driver) {}

  async waitForActivityEntry(transactionType: string): Promise<void> {
    await this.driver.waitForSelector({
      css: '.transaction-list__completed-transactions .transaction-list-item',
      text: transactionType,
    });
  }

  async openActivityDetails(transactionType: string): Promise<void> {
    await this.driver.clickElement({
      css: '.transaction-list__completed-transactions .transaction-list-item',
      text: transactionType,
    });
  }

  async verifyTransactionDetails(expectedDetails: Record<string, string>): Promise<void> {
    for (const [key, value] of Object.entries(expectedDetails)) {
      await this.driver.waitForSelector({
        css: '.transaction-detail-item',
        text: `${key}: ${value}`,
      });
    }
  }
}
