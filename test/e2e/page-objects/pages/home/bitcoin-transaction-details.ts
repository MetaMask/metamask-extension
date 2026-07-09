import { Driver } from '../../../webdriver/driver';

class BitcoinTransactionDetailsPage {
  private readonly driver: Driver;

  constructor(driver: Driver) {
    this.driver = driver;
  }

  async checkAddressInLog(address: string): Promise<void> {
    const shortened = `${address.slice(0, 7)}...${address.slice(-5)}`;
    await this.driver.waitForSelector({
      css: '[data-testid="transaction-details-address"]',
      text: shortened,
    });
  }

  async checkAmount(text: string): Promise<void> {
    await this.driver.waitForSelector({
      css: '[data-testid="transaction-list-item-primary-currency"]',
      text,
    });
  }

  async checkHashLinkPresent(): Promise<void> {
    await this.driver.waitForSelector('[data-testid="transaction-id"]');
  }

  async checkPageIsLoaded(): Promise<void> {
    await this.driver.waitForSelector(
      '[data-testid="transaction-details-back-button"]',
    );
  }

  async checkStatus(status: string): Promise<void> {
    await this.driver.waitForSelector({
      css: '[data-testid^="transaction-details-status-"]',
      text: status,
    });
  }

  async checkTime(): Promise<void> {
    await this.driver.waitForSelector({
      css: '[data-testid="transaction-breakdown-row-title"]',
      text: 'Date',
    });
  }

  async checkTitle(text: string): Promise<void> {
    await this.driver.waitForSelector({ tag: 'h4', text });
  }

  async checkViewDetailsLink(): Promise<void> {
    await this.driver.waitForSelector(
      '[data-testid="transaction-details-block-explorer"]',
    );
  }
}

export default BitcoinTransactionDetailsPage;
