import { strict as assert } from 'assert';
import { Driver } from '../../webdriver/driver';
import { DEFAULT_GANACHE_ETH_BALANCE_DEC } from '../../constants';
import HeaderNavbar from './header-navbar';

class HomePage {
  private driver: Driver;

  private sendButton: string;

  private activityTab: string;

  private tokensTab: string;

  private balance: string;

  private completedTransactions: string;

  private confirmedTransactions: object;

  private failedTransactions: object;

  private transactionAmountsInActivity: string;

  private activityListAction: string;

  private recipientNameInActivity: string;

  private recipientPopoverAddress: string;

  private emptyTransactionMessage: object;

  public headerNavbar: HeaderNavbar;

  constructor(driver: Driver) {
    this.driver = driver;
    this.headerNavbar = new HeaderNavbar(driver);
    this.sendButton = '[data-testid="eth-overview-send"]';
    this.activityTab = '[data-testid="account-overview__activity-tab"]';
    this.tokensTab = '[data-testid="account-overview__asset-tab"]';
    this.confirmedTransactions = {
      text: 'Confirmed',
      css: '.transaction-status-label--confirmed',
    };
    this.failedTransactions = {
      text: 'Failed',
      css: '.transaction-status-label--failed',
    };
    this.balance = '[data-testid="eth-overview__primary-currency"]';
    this.completedTransactions = '[data-testid="activity-list-item"]';
    this.transactionAmountsInActivity =
      '[data-testid="transaction-list-item-primary-currency"]';
    this.activityListAction = '[data-testid="activity-list-item-action"]';
    this.emptyTransactionMessage = {
      text: 'You have no transactions',
      css: '.transaction-list__empty-text',
    };
    this.recipientNameInActivity = '[data-testid="sender-to-recipient__name"]';
    this.recipientPopoverAddress =
      '[data-testid="nickname-popover__public-address"]';
  }

  async check_pageIsLoaded(): Promise<void> {
    try {
      await this.driver.waitForMultipleSelectors([
        this.sendButton,
        this.activityTab,
        this.tokensTab,
      ]);
    } catch (e) {
      console.log('Timeout while waiting for home page to be loaded', e);
      throw e;
    }
    console.log('Home page is loaded');
  }

  async check_expectedBalanceIsDisplayed(
    expectedBalance: string = DEFAULT_GANACHE_ETH_BALANCE_DEC,
  ): Promise<void> {
    try {
      await this.driver.waitForSelector({
        css: this.balance,
        text: `${expectedBalance} ETH`,
      });
    } catch (e) {
      const balance = await this.driver.waitForSelector(this.balance);
      const currentBalance = parseFloat(await balance.getText());
      const errorMessage = `Expected balance ${expectedBalance} ETH, got balance ${currentBalance} ETH`;
      console.log(errorMessage, e);
      throw e;
    }
    console.log(
      `Expected balance ${expectedBalance} ETH is displayed on homepage`,
    );
  }

  async startSendFlow(): Promise<void> {
    await this.driver.clickElement(this.sendButton);
  }

  async goToActivityList(): Promise<void> {
    console.log(`Open activity tab on homepage`);
    await this.driver.clickElement(this.activityTab);
  }

  /**
   * This function checks if the specified number of confirmed transactions are displayed in the activity list on homepage.
   * It waits up to 10 seconds for the expected number of confirmed transactions to be visible.
   *
   * @param expectedNumber - The number of confirmed transactions expected to be displayed in activity list. Defaults to 1.
   * @returns A promise that resolves if the expected number of confirmed transactions is displayed within the timeout period.
   */
  async check_confirmedTxNumberDisplayedInActivity(
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
    }, 10000);
    console.log(
      `${expectedNumber} confirmed transactions found in activity list on homepage`,
    );
  }

  /**
   * This function checks the specified number of completed transactions are displayed in the activity list on the homepage.
   * It waits up to 10 seconds for the expected number of completed transactions to be visible.
   *
   * @param expectedNumber - The number of completed transactions expected to be displayed in the activity list. Defaults to 1.
   * @returns A promise that resolves if the expected number of completed transactions is displayed within the timeout period.
   */
  async check_completedTxNumberDisplayedInActivity(
    expectedNumber: number = 1,
  ): Promise<void> {
    console.log(
      `Wait for ${expectedNumber} completed transactions to be displayed in activity list`,
    );
    if (expectedNumber === 0) {
      await this.driver.assertElementNotPresent(this.completedTransactions);
      return;
    }
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
   * This function checks if the specified number of failed transactions are displayed in the activity list on the homepage.
   * It waits up to 10 seconds for the expected number of failed transactions to be visible.
   *
   * @param expectedNumber - The number of failed transactions expected to be displayed in the activity list. Defaults to 1.
   * @returns A promise that resolves if the expected number of failed transactions is displayed within the timeout period.
   */
  async check_failedTxNumberDisplayedInActivity(
    expectedNumber: number = 1,
  ): Promise<void> {
    console.log(
      `Wait for ${expectedNumber} failed transactions to be displayed in activity list`,
    );
    await this.driver.wait(async () => {
      const failedTxs = await this.driver.findElements(this.failedTransactions);
      return failedTxs.length === expectedNumber;
    }, 10000);
    console.log(
      `${expectedNumber} failed transactions found in activity list on homepage`,
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
   * await check_txAmountInActivity('2 ETH', 3);
   */
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
   * This function checks if the specified transaction action name at the given index matches the expected one.
   *
   * @param expectedActionName - The expected action name of the transaction to be displayed.
   * @param expectedNumber - The 1-based index of the transaction in the activity list whose action name is to be checked.
   * Defaults to 1, indicating the first transaction in the list.
   * @returns A promise that resolves if the transaction action name at the specified index matches the expected action name.
   * The promise is rejected if the action names do not match or if an error occurs during the process.
   * @example
   * // To check if the third transaction in the activity list displays an action name of 'Send ETH'
   * await check_txActionNameInActivity('Send ETH', 3);
   */
  async check_txActionNameInActivity(
    expectedActionName: string,
    expectedNumber: number = 1,
  ): Promise<void> {
    const transactionActions = await this.driver.findElements(
      this.activityListAction,
    );
    const transactionActionsText = await transactionActions[
      expectedNumber - 1
    ].getText();
    assert.equal(
      transactionActionsText,
      expectedActionName,
      `${transactionActionsText} is displayed as transaction action name instead of ${expectedActionName} for transaction ${expectedNumber}`,
    );
    console.log(
      `Amount for transaction ${expectedNumber} is displayed as ${expectedActionName}`,
    );
  }

  async check_activityListIsEmpty(): Promise<void> {
    try {
      await this.driver.waitForSelector(this.emptyTransactionMessage);
    } catch (e) {
      console.log('Activity list is not empty!', e);
      throw e;
    }
    console.log('Activity list on homepage is empty');
  }

  /**
   * Checks if the recipient address in a transaction within the activity list matches the expected recipient address.
   *
   * @param expectedRecipient - The expected recipient address.
   * @param expectedNumber - The 1-based index of the transaction in the activity list to check.
   * Defaults to 1, indicating the first transaction in the list.
   * @returns A promise that resolves if the recipient address matches the expected address.
   */
  async check_txRecipientInActivity(
    expectedRecipient: string,
    expectedNumber: number = 1,
  ): Promise<void> {
    const transactions = await this.driver.findElements(
      this.completedTransactions,
    );
    await transactions[expectedNumber - 1].click();
    await this.driver.clickElement(this.recipientNameInActivity);
    try {
      await this.driver.waitForSelector({
        css: this.recipientPopoverAddress,
        text: expectedRecipient,
      });
    } catch (e) {
      console.log(
        `Fail. Recipient address for transaction ${expectedNumber} is not ${expectedRecipient} as expected.`,
        e,
      );
      throw e;
    }
    console.log(
      `Success. Recipient address for transaction ${expectedNumber} is displayed as ${expectedRecipient}`,
    );
  }
}

export default HomePage;
