import { strict as assert } from 'assert';
import { Driver } from '../../../webdriver/driver';

class ActivityListPage {
  private readonly driver: Driver;

  private readonly activityListAction =
    '[data-testid="activity-list-item-action"]';

  private readonly completedTransactionItems =
    '.transaction-list__completed-transactions .activity-list-item';

  private readonly activityTab =
    '[data-testid="account-overview__activity-tab"]';

  private readonly completedTransactions = '[data-testid="activity-list-item"]';

  private readonly confirmedTransactions = {
    text: 'Confirmed',
    css: '.transaction-status-label--confirmed',
  };

  private readonly failedTransactions = {
    text: 'Failed',
    css: '.transaction-status-label--failed',
  };

  private readonly tooltip = '.tippy-tooltip-content';

  private readonly bridgeTransactionCompleted =
    '.transaction-status-label--confirmed';

  private readonly bridgeTransactionPending =
    '.bridge-transaction-details__segment--pending';

  private readonly transactionAmountsInActivity =
    '[data-testid="transaction-list-item-primary-currency"]';

  private readonly viewTransactionOnExplorerButton = {
    text: 'View on block explorer',
    tag: 'a',
  };

  private readonly cancelTransactionButton = {
    text: 'Cancel',
    tag: 'button',
  };

  private readonly speedupButton = '[data-testid="speedup-button"]';

  private readonly confirmTransactionReplacementButton = {
    text: 'Submit',
    tag: 'button',
  };

  constructor(driver: Driver) {
    this.driver = driver;
  }

  async openActivityTab(): Promise<void> {
    console.log('Opening activity tab');
    await this.driver.clickElement(this.activityTab);
  }

  /**
   * This function clicks on the activity at the specified index.
   * Note: this function need to be called after checkCompletedTxNumberDisplayedInActivity to reduce flakiness.
   *
   * @param expectedNumber - The 1-based index of the activity to be clicked.
   */
  async clickOnActivity(expectedNumber: number): Promise<void> {
    console.log(`Clicking on activity ${expectedNumber}`);
    const activities = await this.driver.findElements(this.activityListAction);
    await activities[expectedNumber - 1].click();
  }

  /**
   * This function clicks on the "View on block explorer" button for the specified transaction.
   *
   * @param expectedNumber - The 1-based index of the transaction to be clicked.
   */
  async viewTransactionOnExplorer(expectedNumber: number): Promise<void> {
    console.log(
      `Viewing transaction on explorer for transaction ${expectedNumber}`,
    );
    await this.clickOnActivity(expectedNumber);
    await this.driver.clickElement(this.viewTransactionOnExplorerButton);
  }

  /**
   * This function checks the specified number of completed transactions are displayed in the activity list on the homepage.
   * It waits up to 10 seconds for the expected number of completed transactions to be visible.
   *
   * @param expectedNumber - The number of completed transactions expected to be displayed in the activity list. Defaults to 1.
   * @returns A promise that resolves if the expected number of completed transactions is displayed within the timeout period.
   */
  async checkCompletedTxNumberDisplayedInActivity(
    expectedNumber: number = 1,
  ): Promise<void> {
    console.log(
      `Wait for ${expectedNumber} completed transactions to be displayed in activity list`,
    );
    await this.driver.wait(async () => {
      const completedTxs = await this.driver.findElements(
        this.completedTransactions,
      );
      return completedTxs.length === expectedNumber;
    }, 10000);
    console.log(
      `${expectedNumber} completed transactions found in activity list on homepage`,
    );
  }

  /**
   * This function checks if the specified number of confirmed transactions are displayed in the activity list on homepage.
   * It waits up to 10 seconds for the expected number of confirmed transactions to be visible.
   *
   * @param expectedNumber - The number of confirmed transactions expected to be displayed in activity list. Defaults to 1.
   * @returns A promise that resolves if the expected number of confirmed transactions is displayed within the timeout period.
   */
  async checkConfirmedTxNumberDisplayedInActivity(
    expectedNumber: number = 1,
  ): Promise<void> {
    console.log(
      `Wait for ${expectedNumber} confirmed transactions to be displayed in activity list`,
    );
    await this.driver.wait(async () => {
      const confirmedTxs = await this.driver.findElements(
        this.confirmedTransactions,
      );
      return confirmedTxs.length === expectedNumber;
    }, 60000);
    console.log(
      `${expectedNumber} confirmed transactions found in activity list on homepage`,
    );
  }

  /**
   * This function checks if the specified number of failed transactions is displayed in the activity list on homepage.
   * It waits up to 10 seconds for the expected number of failed transactions to be visible.
   *
   * @param expectedNumber - The number of failed transactions expected to be displayed in activity list. Defaults to 1.
   * @returns A promise that resolves if the expected number of failed transactions is displayed within the timeout period.
   */
  async checkFailedTxNumberDisplayedInActivity(
    expectedNumber: number = 1,
  ): Promise<void> {
    console.log(
      `Wait for ${expectedNumber} failed transactions to be displayed in activity list`,
    );
    await this.driver.wait(async () => {
      const failedTxs = await this.driver.findElements(this.failedTransactions);
      return failedTxs.length === expectedNumber;
    }, 60000);
    console.log(
      `${expectedNumber} failed transactions found in activity list on homepage`,
    );
  }

  async checkNoTxInActivity(): Promise<void> {
    await this.driver.assertElementNotPresent(this.completedTransactions);
  }

  /**
   * Check if a transaction at the specified index displays the expected action text in the activity list.
   *
   * @param params - The parameters object containing:
   * @param params.action - The expected action text to be displayed (e.g., "Send", "Receive", "Swap")
   * @param params.txIndex - The index of the transaction to check in the activity list
   * @param params.completedTxs - The total number of completed transactions expected to be displayed in the activity list
   * @returns A promise that resolves if the transaction at the specified index displays the expected action text within the timeout period.
   */
  async checkTxAction({
    action,
    txIndex = 1,
    completedTxs = 1,
  }: {
    action: string;
    txIndex?: number;
    completedTxs?: number;
  }): Promise<void> {
    // We need to wait for the total number of tx's to be able to use getText() without race conditions.
    await this.checkCompletedTxNumberDisplayedInActivity(completedTxs);

    const transactionActions = await this.driver.findElements(
      this.activityListAction,
    );
    await this.driver.wait(async () => {
      const transactionActionText =
        await transactionActions[txIndex - 1].getText();
      return transactionActionText === action;
    }, 60000);
    console.log(`Action for transaction ${txIndex} is displayed as ${action}`);
  }

  /**
   * This function checks the specified number of pending Birdge transactions are displayed in the activity list on the homepage.
   * It waits up to 10 seconds for the expected number of pending transactions to be visible.
   *
   * @param expectedNumber - The number of pending Bridge transactions expected to be displayed in the activity list. Defaults to 1.
   * @returns A promise that resolves if the expected number of Bridge pending transactions is displayed within the timeout period.
   */
  async checkPendingBridgeTransactionActivity(
    expectedNumber: number = 1,
  ): Promise<void> {
    console.log(
      `Wait for ${expectedNumber} Bridge pending transactions to be displayed in activity list`,
    );
    await this.driver.wait(async () => {
      const completedTxs = await this.driver.findElements(
        this.bridgeTransactionPending,
      );
      return completedTxs.length === expectedNumber;
    }, 60000);
    console.log(
      `${expectedNumber} Bridge pending transactions found in activity list on homepage`,
    );
  }

  /**
   * This function checks the specified number of completed Birdge transactions are displayed in the activity list on the homepage.
   * It waits up to 10 seconds for the expected number of completed transactions to be visible.
   *
   * @param expectedNumber - The number of completed Bridge transactions expected to be displayed in the activity list. Defaults to 1.
   * @returns A promise that resolves if the expected number of Bridge completed transactions is displayed within the timeout period.
   */
  async checkCompletedBridgeTransactionActivity(
    expectedNumber: number = 1,
  ): Promise<void> {
    console.log(
      `Wait for ${expectedNumber} Bridge completed transactions to be displayed in activity list`,
    );
    await this.driver.wait(async () => {
      const completedTxs = await this.driver.findElements(
        this.bridgeTransactionCompleted,
      );
      return completedTxs.length === expectedNumber;
    }, 60000);
    console.log(
      `${expectedNumber} Bridge transactions found in activity list on homepage`,
    );
  }

  /**
   * This function checks if a specified transaction amount at the specified index matches the expected one.
   *
   * @param expectedAmount - The expected transaction amount to be displayed. Defaults to '-1 ETH'.
   * @param expectedNumber - The 1-based index of the transaction in the activity list whose amount is to be checked.
   * Defaults to 1, indicating the first transaction in the list.
   * @returns A promise that resolves if the transaction amount at the specified index matches the expected amount.
   * The promise is rejected if the amounts do not match or if an error occurs during the process.
   * @example
   * // To check if the third transaction in the activity list displays an amount of '2 ETH'
   * await checkTxAmountInActivity('2 ETH', 3);
   */
  async checkTxAmountInActivity(
    expectedAmount: string = '-1 ETH',
    expectedNumber: number = 1,
  ): Promise<void> {
    await this.driver.waitForSelector(this.transactionAmountsInActivity);
    const transactionAmounts = await this.driver.findElements(
      this.transactionAmountsInActivity,
    );
    const transactionAmountsText =
      await transactionAmounts[expectedNumber - 1].getText();
    assert.equal(
      transactionAmountsText,
      expectedAmount,
      `${transactionAmountsText} is displayed as transaction amount instead of ${expectedAmount} for transaction ${expectedNumber}`,
    );
    console.log(
      `Amount for transaction ${expectedNumber} is displayed as ${expectedAmount}`,
    );
  }

  /**
   * Verifies that a specific warning message is displayed on the activity list.
   *
   * @param warningText - The expected warning text to validate against.
   * @returns A promise that resolves if the warning message matches the expected text.
   * @throws Assertion error if the warning message does not match the expected text.
   */
  async checkWarningMessage(warningText: string): Promise<void> {
    console.log(
      `Check warning message "${warningText}" is displayed on activity list`,
    );
    await this.driver.waitForSelector({
      tag: 'div',
      text: warningText,
    });
  }

  async checkCompletedTransactionItems(
    expectedNumber: number = 1,
  ): Promise<void> {
    console.log(
      `Check ${expectedNumber} completed transaction items are displayed in activity list`,
    );
    await this.driver.wait(async () => {
      const confirmedTxes = await this.driver.findElements(
        this.completedTransactionItems,
      );
      return confirmedTxes.length === expectedNumber;
    }, 10000);
  }

  async getAllTransactionAmounts(): Promise<string[]> {
    console.log('Getting all transaction amounts');
    const transactionAmounts = await this.driver.findElements(
      this.transactionAmountsInActivity,
    );
    const amounts = await Promise.all(
      transactionAmounts.map(async (amount) => await amount.getText()),
    );

    console.log('Transaction amounts found', amounts);
    return amounts;
  }

  async checkTransactionAmount(transactionAmount: string): Promise<void> {
    console.log('Validate transaction amount');
    await this.driver.waitForSelector({
      css: this.transactionAmountsInActivity,
      text: transactionAmount,
    });
  }

  async checkNoFailedTransactions(): Promise<void> {
    try {
      await this.driver.findElement(this.failedTransactions, 1);
    } catch (error) {
      return;
    }

    const failedTxs = await this.driver.findElements(this.failedTransactions);

    if (!failedTxs.length) {
      return;
    }

    const errorMessages = [];

    for (const failedTx of failedTxs) {
      await this.driver.hoverElement(failedTx);

      const tooltip = await this.driver.findElement(this.tooltip);
      const errorMessage = await tooltip.getText();

      errorMessages.push(errorMessage);
    }

    throw new Error(
      `Failed transactions found in activity list: ${errorMessages.join('\n')}`,
    );
  }

  async clickTransactionListItem() {
    await this.driver.clickElement(this.completedTransactions);
  }

  async clickCancelTransaction() {
    await this.driver.clickElement(this.cancelTransactionButton);
  }

  async clickSpeedUpTransaction() {
    await this.driver.clickElement(this.speedupButton);
  }

  async clickConfirmTransactionReplacement() {
    await this.driver.clickElementAndWaitToDisappear(
      this.confirmTransactionReplacementButton,
    );
  }

  async checkWaitForTransactionStatus(status: 'confirmed' | 'cancelled') {
    await this.driver.waitForSelector(`.transaction-status-label--${status}`, {
      timeout: 5000,
    });
  }

  /**
   * Checks for the presence of a transaction activity item in the activity list by matching the provided text.
   *
   * @param txnText - The text to search for within the transaction activity list. (e.g., "Swap SOL to USDC")
   * @returns A promise that resolves when the transaction activity with the specified text is found.
   */
  async checkTransactionActivityByText(txnText: string): Promise<void> {
    console.log(`Check transaction activity with text: ${txnText}`);
    await this.driver.waitForSelector({
      text: txnText,
      css: this.activityListAction,
    });
  }
}

export default ActivityListPage;
