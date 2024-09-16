import { BasePage } from '../base-page';
import { ActivityTab } from './activity-tab';

export default class TransactionDetails extends BasePage {
  // Transaction details elements
  private transactionStatus = '[data-testid="transaction-status"]';

  private transactionAmount = '[data-testid="transaction-amount"]';

  private transactionFee = '[data-testid="transaction-fee"]';

  private transactionHash = '[data-testid="transaction-hash"]';

  private transactionBreakdownAmount =
    '[data-testid="transaction-breakdown-value-amount"]';

  private popoverClose = '[data-testid="popover-close"]';

  async check_transactionStatus(expectedStatus: string): Promise<void> {
    const status = await this.driver.waitForSelector(this.transactionStatus);
    const statusText = await status.getText();
    if (statusText !== expectedStatus) {
      throw new Error(
        `Expected transaction status ${expectedStatus}, but got ${statusText}`,
      );
    }
    console.log(`Transaction status is ${expectedStatus}`);
  }

  async check_transactionAmount(expectedAmount: string): Promise<void> {
    const amount = await this.driver.waitForSelector(this.transactionAmount);
    const amountText = await amount.getText();
    if (amountText !== expectedAmount) {
      throw new Error(
        `Expected transaction amount ${expectedAmount}, but got ${amountText}`,
      );
    }
    console.log(`Transaction amount is ${expectedAmount}`);
  }

  async check_transactionFee(expectedFee: string): Promise<void> {
    const fee = await this.driver.waitForSelector(this.transactionFee);
    const feeText = await fee.getText();
    if (feeText !== expectedFee) {
      throw new Error(
        `Expected transaction fee ${expectedFee}, but got ${feeText}`,
      );
    }
    console.log(`Transaction fee is ${expectedFee}`);
  }

  async check_transactionHash(expectedHash: string): Promise<void> {
    const hash = await this.driver.waitForSelector(this.transactionHash);
    const hashText = await hash.getText();
    if (hashText !== expectedHash) {
      throw new Error(
        `Expected transaction hash ${expectedHash}, but got ${hashText}`,
      );
    }
    console.log(`Transaction hash is ${expectedHash}`);
  }

  async verifySwapTransactionDetails(swapFrom: string, amount: string) {
    await this.driver.findElement({
      css: this.transactionStatus,
      text: 'Confirmed',
    });

    await this.driver.findElement({
      css: this.transactionBreakdownAmount,
      text: `-${amount} ${swapFrom}`,
    });
  }

  async closeTransactionDetails(): Promise<ActivityTab> {
    await this.driver.clickElement(this.popoverClose);
    return new ActivityTab(this.driver);
  }
}
