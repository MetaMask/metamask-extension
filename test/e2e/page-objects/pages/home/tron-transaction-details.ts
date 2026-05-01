import { Driver } from '../../../webdriver/driver';

class TronTransactionDetailsPage {
  private readonly driver: Driver;

  private readonly tronExplorerUrl = 'https://tronscan.org';

  constructor(driver: Driver) {
    this.driver = driver;
  }

  private readonly amount = (text: string) => ({
    css: '[data-testid="transaction-list-item-primary-currency"]',
    text,
  });

  private readonly networkFee = (text: string) => ({
    css: '[data-testid="transaction-base-fee"]',
    text,
  });

  private readonly statusSelector = (text: string) => ({ tag: 'p', text });

  private readonly titleSelector = (text: string) => ({ tag: 'h1', text });

  private readonly timeRow = { testId: 'transaction-list-item-date' };

  private hashLink(txHash: string) {
    return `a[href='${this.tronExplorerUrl}/#/transaction/${txHash}']`;
  }

  private readonly viewDetailsLink = { tag: 'button', text: 'View details' };

  async checkTitle(text: string): Promise<void> {
    await this.driver.waitForSelector(this.titleSelector(text));
  }

  async checkTime(): Promise<void> {
    await this.driver.waitForSelector(this.timeRow);
  }

  async checkStatus(status: string): Promise<void> {
    await this.driver.waitForSelector(this.statusSelector(status));
  }

  async checkAmount(text: string): Promise<void> {
    await this.driver.waitForSelector(this.amount(text));
  }

  async checkNetworkFee(fee: string): Promise<void> {
    await this.driver.waitForSelector(this.networkFee(fee));
  }

  async checkHashLink(txHash: string): Promise<void> {
    await this.driver.waitForSelector(this.hashLink(txHash));
  }

  async checkAddressInLog(address: string): Promise<void> {
    await this.driver.waitForSelector({
      css: '.name__value',
      text: address,
    });
  }

  async checkViewDetailsLink(): Promise<void> {
    await this.driver.waitForSelector(this.viewDetailsLink);
  }
}

export default TronTransactionDetailsPage;
