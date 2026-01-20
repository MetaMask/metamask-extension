import { Driver } from '../../../webdriver/driver';

class TransactionDetailsPage {
  private readonly driver: Driver;

  private readonly solanaExplorerUrl = 'https://solscan.io';

  constructor(driver: Driver) {
    this.driver = driver;
  }

  private readonly amount = (amount: string) => ({
    testId: 'transaction-list-item-primary-currency',
    text: amount,
  });

  private readonly baseFee = (fee: string) => ({
    testId: 'transaction-base-fee',
    text: fee,
  });

  private readonly fromToLink = (fromToAddress: string) =>
    `a[href='${this.solanaExplorerUrl}/account/${fromToAddress}']`;

  private readonly hashLink = (txHash: string) =>
    `a[href='${this.solanaExplorerUrl}/tx/${txHash}']`;

  private readonly status = (status: string) => ({
    tag: 'p',
    text: status,
  });

  private readonly viewDetailsLink = {
    tag: 'button',
    text: 'View details',
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
}

export default TransactionDetailsPage;
