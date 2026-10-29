import { Driver } from '../../../webdriver/driver';
import TransactionConfirmation from './transaction-confirmation';

/**
 * Batch / EIP-7702 sendCalls confirmation on the redesigned confirm screen.
 *
 * Screen: `#/confirmation` for batched nested transactions.
 * Owns: batch transaction list presence, interacting-with account display,
 * and per-call tx-type assertions.
 * Boundaries: inherits shared transaction/gas helpers from
 * `TransactionConfirmation`. Individual nested-call editing is not covered
 * here.
 * Related: `TransactionConfirmation`.
 *
 * @see ui/pages/confirmations/components/confirm/info/batch/nested-transaction-data/nested-transaction-data.tsx
 * @see ui/pages/confirmations/components/confirm/info/batch/transaction-account-details/transaction-account-details.tsx
 */
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
