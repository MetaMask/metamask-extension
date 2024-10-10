import { strict as assert } from 'assert';
import { Driver } from '../../webdriver/driver';
import { Ganache } from '../../seeder/ganache';
import HeaderNavbar from './header-navbar';

class HomePage {
  private driver: Driver;

  private readonly sendButton = '[data-testid="eth-overview-send"]';

  private readonly activityTab =
    '[data-testid="account-overview__activity-tab"]';

  private readonly tokensTab = '[data-testid="account-overview__asset-tab"]';

  private readonly balance = '[data-testid="eth-overview__primary-currency"]';

  private readonly completedTransactions = '[data-testid="activity-list-item"]';

  private readonly confirmedTransactions = {
    text: 'Confirmed',
    css: '.transaction-status-label--confirmed',
  };

  private readonly transactionAmountsInActivity =
    '[data-testid="transaction-list-item-primary-currency"]';

  public headerNavbar: HeaderNavbar;

  private readonly failedTransactions = {
    text: 'Failed',
    css: '.transaction-status-label--failed',
  };

  constructor(driver: Driver) {
    this.driver = driver;
    this.headerNavbar = new HeaderNavbar(driver);
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
   * Checks if the expected balance is displayed on homepage.
   *
   * @param expectedBalance - The expected balance to be displayed. Defaults to '0'.
   */
  async check_expectedBalanceIsDisplayed(
    expectedBalance: string = '0',
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

  /**
   * This function checks if the specified number of failed transactions are displayed in the activity list on homepage.
   * It waits up to 10 seconds for the expected number of failed transactions to be visible.
   *
   * @param expectedNumber - The number of failed transactions expected to be displayed in activity list. Defaults to 1.
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

  async check_ganacheBalanceIsDisplayed(
    ganacheServer?: Ganache,
    address = null,
  ): Promise<void> {
    let expectedBalance: string;
    if (ganacheServer) {
      expectedBalance = (await ganacheServer.getBalance(address)).toString();
    } else {
      expectedBalance = '0';
    }
    await this.check_expectedBalanceIsDisplayed(expectedBalance);
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
}

export default HomePage;
