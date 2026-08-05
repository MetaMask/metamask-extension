import { Driver } from '../../webdriver/driver';

class TransactionDetailsPage {
  private readonly addressInLog = (address: string) => ({
    testId: 'transaction-details-address',
    text: `${address.slice(0, 7)}...${address.slice(-5)}`,
  });

  private readonly addressLink = (address: string) =>
    `[data-address="${address}"]`;

  private readonly amount = (amount: string) => ({
    testId: 'transaction-list-item-primary-currency',
    text: amount,
  });

  private readonly backButton = { testId: 'transaction-details-back-button' };

  private readonly baseFee = (fee: string) => ({
    testId: 'transaction-base-fee',
    text: fee,
  });

  private readonly dateRow = {
    testId: 'transaction-breakdown-row-title',
    text: 'Date',
  };

  private readonly driver: Driver;

  private readonly explorerTestId = 'transaction-details-block-explorer';

  private readonly hashId = { testId: 'transaction-id' };

  // Verifies the block explorer link points at the given explorer, e.g.
  // `https://solscan.io` for Solana or `https://etherscan.io` for Ethereum.
  private readonly hashLink = (txHash: string, explorerUrl: string) =>
    `[data-testid="${this.explorerTestId}"][data-explorer-url="${explorerUrl}/tx/${txHash}"]`;

  private readonly status = (status: string) => ({
    css: '[data-testid^="transaction-details-status-"]',
    text: status,
  });

  private readonly statusByTestId = (status: string) => ({
    testId: `transaction-details-status-${status}`,
  });

  private readonly title = (text: string) => ({ tag: 'h4', text });

  private readonly viewDetailsLink = { testId: this.explorerTestId };

  constructor(driver: Driver) {
    this.driver = driver;
  }

  async checkAddressInActivityLog(address: string): Promise<void> {
    console.log(`Checking address ${address} in activity log`);
    await this.driver.waitForSelector(this.addressLink(address));
  }

  async checkAddressInLog(address: string): Promise<void> {
    await this.driver.waitForSelector(this.addressInLog(address));
  }

  async checkAmount(amount: string): Promise<void> {
    await this.driver.waitForSelector(this.amount(amount));
  }

  async checkBaseFee(fee: string): Promise<void> {
    await this.driver.waitForSelector(this.baseFee(fee));
  }

  async checkFromToLink(address: string): Promise<void> {
    await this.driver.waitForSelector(this.addressLink(address));
  }

  async checkHashLink(txHash: string, explorerUrl: string): Promise<void> {
    await this.driver.waitForSelector(this.hashLink(txHash, explorerUrl));
  }

  async checkHashLinkPresent(): Promise<void> {
    await this.driver.waitForSelector(this.hashId);
  }

  async checkPageIsLoaded(): Promise<void> {
    await this.driver.waitForSelector(this.backButton);
  }

  async checkStatus(status: string): Promise<void> {
    await this.driver.waitForSelector(this.status(status));
  }

  async checkStatusByTestId(status: string): Promise<void> {
    await this.driver.waitForSelector(this.statusByTestId(status));
  }

  async checkTime(): Promise<void> {
    await this.driver.waitForSelector(this.dateRow);
  }

  async checkTitle(text: string): Promise<void> {
    await this.driver.waitForSelector(this.title(text));
  }

  async checkViewDetailsLink(): Promise<void> {
    await this.driver.waitForSelector(this.viewDetailsLink);
  }
}

export default TransactionDetailsPage;
