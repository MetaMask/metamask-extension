import { strict as assert } from 'assert';
import { Driver } from '../../webdriver/driver';
import { DEFAULT_GANACHE_ETH_BALANCE_DEC } from '../../constants';
import HeaderNavbar from './header-navbar';

class HomePage {
  public readonly headerNavbar: HeaderNavbar;

  private readonly driver: Driver;

  private readonly sendButton: string = '[data-testid="eth-overview-send"]';

  private readonly activityTab: string =
    '[data-testid="account-overview__activity-tab"]';

  private readonly tokensTab: string =
    '[data-testid="account-overview__asset-tab"]';

  private readonly balance: string =
    '[data-testid="eth-overview__primary-currency"]';

  private readonly completedTransactions: string =
    '[data-testid="activity-list-item"]';

  private readonly confirmedTransactions: object = {
    text: 'Confirmed',
    css: '.transaction-status-label--confirmed',
  };

  private readonly transactionAmountsInActivity: string =
    '[data-testid="transaction-list-item-primary-currency"]';

  private readonly accountMenuButton: string =
    '[data-testid="account-menu-icon"]';

  private readonly addAccountButton: string =
    '[data-testid="multichain-account-menu-popover-action-button"]';

  private readonly closeModalButton: string =
    '.mm-box button[aria-label="Close"]';

  constructor(driver: Driver) {
    this.driver = driver;
    this.headerNavbar = new HeaderNavbar(driver);
  }

  async check_pageIsLoaded(): Promise<void> {
    console.log('Checking if home page is loaded');
    try {
      await this.driver.waitForMultipleSelectors([
        this.sendButton,
        this.activityTab,
        this.tokensTab,
      ]);
      console.log('Home page is loaded');
    } catch (error) {
      console.error('Timeout while waiting for home page to be loaded', error);
      throw new Error(`Home page failed to load: ${(error as Error).message}`);
    }
  }

  async check_expectedBalanceIsDisplayed(
    expectedBalance: string = DEFAULT_GANACHE_ETH_BALANCE_DEC,
  ): Promise<void> {
    console.log(`Checking for expected balance: ${expectedBalance} ETH`);
    try {
      await this.driver.waitForSelector({
        css: this.balance,
        text: `${expectedBalance} ETH`,
      });
      console.log(
        `Expected balance ${expectedBalance} ETH is displayed on homepage`,
      );
    } catch (error) {
      console.error(`Failed to verify balance: ${expectedBalance} ETH`, error);
      throw new Error(
        `Balance verification failed: ${(error as Error).message}`,
      );
    }
  }

  async startSendFlow(): Promise<void> {
    console.log('Starting send flow');
    try {
      await this.driver.clickElement(this.sendButton);
      console.log('Send flow initiated successfully');
    } catch (error) {
      console.error('Failed to start send flow', error);
      throw new Error(`Unable to start send flow: ${(error as Error).message}`);
    }
  }

  async goToActivityList(): Promise<void> {
    console.log('Opening activity tab on homepage');
    try {
      await this.driver.clickElement(this.activityTab);
      console.log('Activity tab opened successfully');
    } catch (error) {
      console.error('Failed to open activity tab', error);
      throw new Error(
        `Unable to open activity tab: ${(error as Error).message}`,
      );
    }
  }

  async openAccountMenu(): Promise<void> {
    console.log('Opening account menu');
    try {
      await this.driver.clickElement(this.accountMenuButton);
      console.log('Account menu opened successfully');
    } catch (error) {
      console.error('Failed to open account menu', error);
      throw new Error(
        `Unable to open account menu: ${(error as Error).message}`,
      );
    }
  }

  async openAddAccountModal(): Promise<void> {
    console.log('Opening add account modal');
    try {
      await this.driver.clickElement(this.addAccountButton);
      console.log('Add account modal opened successfully');
    } catch (error) {
      console.error('Failed to open add account modal', error);
      throw new Error(
        `Unable to open add account modal: ${(error as Error).message}`,
      );
    }
  }

  async closeModal(): Promise<void> {
    console.log('Closing modal');
    try {
      await this.driver.clickElement(this.closeModalButton);
      console.log('Modal closed successfully');
    } catch (error) {
      console.error('Failed to close modal', error);
      throw new Error(`Unable to close modal: ${(error as Error).message}`);
    }
  }

  async check_confirmedTxNumberDisplayedInActivity(
    expectedNumber: number = 1,
  ): Promise<void> {
    console.log(
      `Checking for ${expectedNumber} confirmed transaction(s) in activity list`,
    );
    try {
      await this.driver.wait(async () => {
        const confirmedTxs = await this.driver.findElements(
          this.confirmedTransactions,
        );
        return confirmedTxs.length === expectedNumber;
      }, 10000);
      console.log(
        `${expectedNumber} confirmed transaction(s) found in activity list on homepage`,
      );
    } catch (error) {
      console.error(
        `Failed to find ${expectedNumber} confirmed transaction(s)`,
        error,
      );
      throw new Error(
        `Expected ${expectedNumber} confirmed transaction(s) not found in activity list: ${
          (error as Error).message
        }`,
      );
    }
  }

  async check_completedTxNumberDisplayedInActivity(
    expectedNumber: number = 1,
  ): Promise<void> {
    console.log(
      `Checking for ${expectedNumber} completed transaction(s) in activity list`,
    );
    try {
      await this.driver.wait(async () => {
        const completedTxs = await this.driver.findElements(
          this.completedTransactions,
        );
        return completedTxs.length === expectedNumber;
      }, 10000);
      console.log(
        `${expectedNumber} completed transaction(s) found in activity list on homepage`,
      );
    } catch (error) {
      console.error(
        `Failed to find ${expectedNumber} completed transaction(s)`,
        error,
      );
      throw new Error(
        `Expected ${expectedNumber} completed transaction(s) not found in activity list: ${
          (error as Error).message
        }`,
      );
    }
  }

  async check_txAmountInActivity(
    expectedAmount: string = '-1 ETH',
    expectedNumber: number = 1,
  ): Promise<void> {
    console.log(
      `Checking transaction amount for transaction ${expectedNumber}`,
    );
    try {
      const transactionAmounts = await this.driver.findElements(
        this.transactionAmountsInActivity,
      );
      const transactionAmountsText = await transactionAmounts[
        expectedNumber - 1
      ].getText();
      assert.strictEqual(
        transactionAmountsText,
        expectedAmount,
        `Transaction amount mismatch. Expected: ${expectedAmount}, Actual: ${transactionAmountsText} for transaction ${expectedNumber}`,
      );
      console.log(
        `Amount for transaction ${expectedNumber} is displayed as ${expectedAmount}`,
      );
    } catch (error) {
      console.error(`Failed to verify transaction amount`, error);
      throw new Error(
        `Transaction amount verification failed for transaction ${expectedNumber}: ${
          (error as Error).message
        }`,
      );
    }
  }

  async assertAddAccountSnapButtonNotPresent(): Promise<void> {
    console.log('Asserting Add account Snap button is not present');
    try {
      await this.driver.assertElementNotPresent(
        {
          text: 'Add account Snap',
          tag: 'button',
        },
        {
          findElementGuard: {
            text: 'Add a new Ethereum account',
            tag: 'button',
          },
        },
      );
      console.log('Add account Snap button is not present as expected');
    } catch (error) {
      console.error(
        'Failed to assert Add account Snap button is not present',
        error,
      );
      throw new Error(
        `Add account Snap button is unexpectedly present: ${
          (error as Error).message
        }`,
      );
    }
  }

  async assertAddAccountSnapButtonPresent(): Promise<void> {
    console.log('Asserting Add account Snap button is present');
    try {
      await this.driver.findElement({
        text: 'Add account Snap',
        tag: 'button',
      });
      console.log('Add account Snap button is present as expected');
    } catch (error) {
      console.error(
        'Failed to assert Add account Snap button is present',
        error,
      );
      throw new Error(
        `Add account Snap button is unexpectedly not present: ${
          (error as Error).message
        }`,
      );
    }
  }
}

export default HomePage;
