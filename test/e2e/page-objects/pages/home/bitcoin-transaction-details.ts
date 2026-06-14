import { Driver } from '../../../webdriver/driver';

class BitcoinTransactionDetailsPage {
  private readonly bitcoinExplorerUrl = 'https://mempool.space';

  private readonly driver: Driver;

  private readonly modal =
    '[data-testid="multichain-transaction-details-modal"]';

  private readonly timeRow = {
    css: 'p.mm-text--text-align-center.mm-box--color-text-alternative',
    text: ', ',
  };

  private readonly viewDetailsLink = { tag: 'button', text: 'View details' };

  constructor(driver: Driver) {
    this.driver = driver;
  }

  private readonly amount = (text: string) => ({
    css: '[data-testid="transaction-amount"]',
    text,
  });

  async checkAddressInLog(address: string): Promise<void> {
    const shortened = `${address.slice(0, 7)}...${address.slice(-5)}`;
    await this.driver.waitForSelector({
      css: '[class*="mm-button-link"], [class*="mm-text"]',
      text: shortened,
    });
  }

  async checkAmount(text: string): Promise<void> {
    await this.driver.waitForSelector(this.amount(text));
  }

  async checkHashLink(txHash: string): Promise<void> {
    await this.driver.waitForSelector(this.hashLink(txHash));
  }

  async checkHashLinkPresent(): Promise<void> {
    await this.driver.waitForSelector(
      `a[href^='${this.bitcoinExplorerUrl}/tx/']`,
    );
  }

  async checkPageIsLoaded(): Promise<void> {
    await this.driver.waitForSelector(this.modal);
  }

  async checkStatus(status: string): Promise<void> {
    await this.driver.waitForSelector(this.statusSelector(status));
  }

  async checkTime(): Promise<void> {
    await this.driver.waitForSelector(this.timeRow);
  }

  async checkTitle(text: string): Promise<void> {
    await this.driver.waitForSelector(this.titleSelector(text));
  }

  async checkViewDetailsLink(): Promise<void> {
    await this.driver.waitForSelector(this.viewDetailsLink);
  }

  private hashLink(txHash: string) {
    return `a[href='${this.bitcoinExplorerUrl}/tx/${txHash}']`;
  }

  private readonly statusSelector = (text: string) => ({ tag: 'p', text });

  private readonly titleSelector = (text: string) => ({
    css: '[class*="mm-text--heading-md"]',
    text,
  });
}

export default BitcoinTransactionDetailsPage;
