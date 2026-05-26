import { Driver } from '../../../webdriver/driver';

class BitcoinTransactionDetailsPage {
  private readonly driver: Driver;

  private readonly bitcoinExplorerUrl = 'https://mempool.space';

  constructor(driver: Driver) {
    this.driver = driver;
  }

  private readonly modal = '[data-testid="multichain-transaction-details-modal"]';

  private readonly amount = (text: string) => ({
    css: '[data-testid="transaction-amount"]',
    text,
  });

  private readonly networkFee = (text: string) => ({
    css: '[data-testid="transaction-base-fee"]',
    text,
  });

  private readonly statusSelector = (text: string) => ({ tag: 'p', text });

  private readonly titleSelector = (text: string) => ({
    css: '[class*="mm-text--heading-md"]',
    text,
  });

  private readonly timeRow = {
    css: 'p.mm-text--text-align-center.mm-box--color-text-alternative',
    text: ', ',
  };

  private hashLink(txHash: string) {
    return `a[href='${this.bitcoinExplorerUrl}/tx/${txHash}']`;
  }

  private readonly viewDetailsLink = { tag: 'button', text: 'View details' };

  async checkPageIsLoaded(): Promise<void> {
    await this.driver.waitForSelector(this.modal);
  }

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

  async checkHashLinkPresent(): Promise<void> {
    await this.driver.waitForSelector(
      `a[href^='${this.bitcoinExplorerUrl}/tx/']`,
    );
  }

  async checkHashLink(txHash: string): Promise<void> {
    await this.driver.waitForSelector(this.hashLink(txHash));
  }

  async checkAddressInLog(address: string): Promise<void> {
    const shortened = `${address.slice(0, 7)}...${address.slice(-5)}`;
    await this.driver.waitForSelector({
      css: '[class*="mm-button-link"], [class*="mm-text"]',
      text: shortened,
    });
  }

  async checkViewDetailsLink(): Promise<void> {
    await this.driver.waitForSelector(this.viewDetailsLink);
  }
}

export default BitcoinTransactionDetailsPage;
