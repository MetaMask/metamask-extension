import { Driver } from '../../../webdriver/driver';

class TransactionDetailsPage {
  private readonly driver: Driver;

  private readonly solanaExplorerUrl = 'https://solscan.io';

  private readonly explorerTestId = 'transaction-details-block-explorer';

  constructor(driver: Driver) {
    this.driver = driver;
  }

  private readonly addressInActivityLog = (address: string) =>
    `[data-address="${address}"]`;

  private readonly amount = (amount: string) => ({
    testId: 'transaction-list-item-primary-currency',
    text: amount,
  });

  private readonly baseFee = (fee: string) => ({
    testId: 'transaction-base-fee',
    text: fee,
  });

  private readonly fromToLink = (fromToAddress: string) =>
    `[data-address="${fromToAddress}"]`;

  private readonly hashLink = (txHash: string) =>
    `[data-testid="${this.explorerTestId}"][data-explorer-url="${this.solanaExplorerUrl}/tx/${txHash}"]`;

  private readonly status = (status: string) => ({
    testId: `transaction-details-status-${status}`,
  });

  private readonly viewDetailsLink = {
    testId: this.explorerTestId,
  };

  async checkTransactionAmount(amount: string): Promise<void> {
    await this.driver.waitForSelector(this.amount(amount));
  }

  async checkTransactionStatus(status: string): Promise<void> {
    await this.driver.waitForSelector(this.status(status));
  }

  async checkTransactionBaseFee(networkFee: string): Promise<void> {
    await this.driver.waitForSelector(this.baseFee(networkFee));
  }

  async checkTransactionFromToLink(fromToAddress: string): Promise<void> {
    await this.driver.waitForSelector(this.fromToLink(fromToAddress));
  }

  async checkTransactionHashLink(txHash: string): Promise<void> {
    await this.driver.waitForSelector(this.hashLink(txHash));
  }

  async checkTransactionViewDetailsLink(): Promise<void> {
    await this.driver.waitForSelector(this.viewDetailsLink);
  }

  async checkAddressInActivityLog(address: string): Promise<void> {
    console.log(`Checking address ${address} in activity log`);
    await this.driver.waitForSelector(this.addressInActivityLog(address));
  }
}

export default TransactionDetailsPage;
