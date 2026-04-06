import { Driver } from '../../../webdriver/driver';

class TransactionDetailsPage {
  private readonly driver: Driver;

  private readonly solanaExplorerUrl = 'https://solscan.io';

  private readonly tronExplorerUrl = 'https://tronscan.org/#';

  constructor(driver: Driver) {
    this.driver = driver;
  }

  private readonly addressInActivityLog = (address: string) => ({
    css: '.name__value',
    text: address,
  });

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

  private readonly linkContaining = (partialHref: string) =>
    `a[href*='${partialHref}']`;

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

  async checkAddressInActivityLog(address: string): Promise<void> {
    console.log(`Checking address ${address} in activity log`);
    await this.driver.waitForSelector(this.addressInActivityLog(address));
  }

  async checkLinkContainsHref(partialHref: string): Promise<void> {
    console.log(`Checking link contains href: ${partialHref}`);
    await this.driver.waitForSelector(this.linkContaining(partialHref));
  }

  async checkTronTransactionHashLink(txHash: string): Promise<void> {
    console.log(`Checking Tron transaction hash link: ${txHash}`);
    await this.driver.waitForSelector(
      this.linkContaining(`${this.tronExplorerUrl}/transaction/${txHash}`),
    );
  }

  async checkTronTransactionFromToLink(address: string): Promise<void> {
    console.log(`Checking Tron from/to address link: ${address}`);
    await this.driver.waitForSelector(
      this.linkContaining(`${this.tronExplorerUrl}/address/${address}`),
    );
  }
}

export default TransactionDetailsPage;
