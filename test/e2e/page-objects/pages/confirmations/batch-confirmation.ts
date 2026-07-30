import { Driver } from '../../../webdriver/driver';
import TransactionConfirmation from './transaction-confirmation';

export default class Eip7702AndSendCalls extends TransactionConfirmation {
  private readonly batchTxList = '[data-testid="batch-txs=]';

  protected driver: Driver;

  private readonly interactingWith =
    '[data-testid="transaction-details-section"]';

  private readonly txType = '[data-testid="tx-type"]';

  constructor(driver: Driver) {
    super(driver);

    this.driver = driver;
  }

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
}
