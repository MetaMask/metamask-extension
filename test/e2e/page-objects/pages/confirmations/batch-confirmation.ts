import { Driver } from '../../../webdriver/driver';
import TransactionConfirmation from './transaction-confirmation';

export default class Eip7702AndSendCalls extends TransactionConfirmation {
  constructor(driver: Driver) {
    super(driver);

    this.driver = driver;
  }

  protected driver: Driver;

  private readonly batchTxList = '[data-testid="batch-txs"]';

  private readonly interactingWith =
    '[data-testid="transaction-details-section"]';

  private readonly txType = '[data-testid="tx-type"]';

  private readonly batchTransactionItem = '[data-testid="batch-tx-item"]';

  private readonly accountUpgradePrompt = '[data-testid="upgrade-prompt"]';

  private readonly smartAccountBanner = '[data-testid="smart-account-banner"]';

  async checkBatchTxListIsPresent(): Promise<void> {
    await this.driver.isElementPresent(this.batchTxList);
  }

  async checkExpectedInteractingWithIsDisplayed(
    account: string,
  ): Promise<void> {
    await this.driver.isElementPresent({
      css: this.interactingWith,
      text: account,
    });
  }

  async checkExpectedTxTypeIsDisplayed(txType: string): Promise<void> {
    await this.driver.isElementPresent({
      css: this.txType,
      text: txType,
    });
  }

  async checkBatchTransactionCount(expectedCount: number): Promise<void> {
    console.log(`Checking batch transaction count: ${expectedCount}`);
    await this.driver.wait(async () => {
      const items = await this.driver.findElements(this.batchTransactionItem);
      return items.length === expectedCount;
    }, 10000);
  }

  async verifyBatchTransactionDetails(index: number): Promise<void> {
    console.log(`Verifying batch transaction details at index ${index}`);
    const selector = `${this.batchTransactionItem}:nth-child(${index + 1})`;
    await this.driver.waitForSelector(selector);
  }

  async checkAccountUpgradePrompt(): Promise<void> {
    console.log('Checking account upgrade prompt');
    await this.driver.waitForSelector({
      css: this.smartAccountBanner,
      text: 'Smart account',
    });
  }

  async checkSmartAccountBannerDisplayed(): Promise<void> {
    console.log('Checking smart account banner is displayed');
    await this.driver.waitForSelector(this.smartAccountBanner);
  }

  async verifyBatchTransactionList(): Promise<void> {
    console.log('Verifying batch transaction list is displayed');
    await this.driver.waitForSelector(this.batchTxList);
    const items = await this.driver.findElements(this.batchTransactionItem);
    console.log(`Found ${items.length} batch transactions`);
  }
}
