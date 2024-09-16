import { strict as assert } from 'assert';
import { Locator } from 'selenium-webdriver';
import { regularDelayMs } from '../../../helpers';
import { BasePage } from '../base-page';

import TransactionDetails from './transaction-details';

export default class ActivityTabPage extends BasePage {}

export class ActivityTab extends BasePage {
  // Transaction list elements
  private activityListItem = '.activity-list-item';

  private completedTransactions = '[data-testid="activity-list-item"]';

  private confirmedTransactions = {
    text: 'Confirmed',
    css: '.transaction-status-label--confirmed',
  };

  private transactionAmountsInActivity =
    '[data-testid="transaction-list-item-primary-currency"]';

  private activityListItemAction = '[data-testid="activity-list-item-action"]';

  private transactionListItemCurrency =
    '[data-testid="transaction-list-item-primary-currency"]';

  async check_pageIsLoaded() {
    await this.driver.waitForSelector(this.activityListItem);
  }

  async check_confirmedTxNumberDisplayedInActivity(
    expectedNumber: number = 1,
  ): Promise<void> {
    console.log(
      `Wait for ${expectedNumber} confirmed transactions to be displayed in activity list`,
    );
    await this.waitForTransactions(this.confirmedTransactions, expectedNumber);
    console.log(
      `${expectedNumber} confirmed transactions found in activity list`,
    );
  }

  async check_completedTxNumberDisplayedInActivity(
    expectedNumber: number = 1,
  ): Promise<void> {
    console.log(
      `Wait for ${expectedNumber} completed transactions to be displayed in activity list`,
    );
    await this.waitForTransactions(this.completedTransactions, expectedNumber);
    console.log(
      `${expectedNumber} completed transactions found in activity list`,
    );
  }

  async check_txAmountInActivity(
    expectedAmount: string = '-1 ETH',
    expectedNumber: number = 1,
  ): Promise<void> {
    const transactionAmounts = await this.driver.findElements(
      this.transactionAmountsInActivity,
    );
    const transactionAmountsText = await transactionAmounts[
      expectedNumber - 1
    ].getText();
    if (transactionAmountsText !== expectedAmount) {
      throw new Error(
        `${transactionAmountsText} is displayed as transaction amount instead of ${expectedAmount} for transaction ${expectedNumber}`,
      );
    }
    console.log(
      `Amount for transaction ${expectedNumber} is displayed as ${expectedAmount}`,
    );
  }

  private async waitForTransactions(
    locator: string | Locator,
    expectedNumber: number,
  ): Promise<void> {
    await this.driver.wait(async () => {
      const txs = await this.driver.findElements(locator);
      return txs.length === expectedNumber;
    }, 10000);
  }

  async verifySwapTransaction(options: {
    index: number;
    swapFrom: string;
    swapTo: string;
    amount: string;
  }) {
    await this.verifySwapTransactionInList(options);
    const txDetails = await this.openTransactionDetails(options.index);
    await txDetails.verifySwapTransactionDetails(
      options.swapFrom,
      options.amount,
    );
    await txDetails.closeTransactionDetails();
  }

  async verifySwapTransactionInList(options: {
    index: number;
    swapFrom: string;
    swapTo: string;
    amount: string;
  }) {
    const transactionList = await this.driver.findElements(
      this.activityListItemAction,
    );
    const transactionText = await transactionList[options.index].getText();
    assert.equal(
      transactionText,
      `Swap ${options.swapFrom} to ${options.swapTo}`,
      'Transaction not found',
    );

    await this.driver.findElement({
      css: this.transactionListItemCurrency,
      text: `-${options.amount} ${options.swapFrom}`,
    });
  }

  async openTransactionDetails(index: number = 0): Promise<TransactionDetails> {
    const transactions = await this.driver.findElements(
      this.completedTransactions,
    );
    await transactions[index].click();
    await this.driver.delay(regularDelayMs);
    return new TransactionDetails(this.driver);
  }
}
