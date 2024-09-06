import { Driver } from '../../../webdriver/driver';

/**
 * Represents the Account List page in the MetaMask extension.
 * This class provides methods to interact with and validate the account list functionality.
 */
export class AccountListPage {
  private readonly driver: Driver;

  // Locators
  private readonly accountMenuIconSelector =
    '[data-testid="account-menu-icon"]';

  private readonly createAccountButtonSelector =
    '[data-testid="multichain-account-menu-popover-action-button"]';

  private readonly addAccountButtonSelector =
    '[data-testid="multichain-account-menu-popover-add-account"]';

  private readonly accountNameInputSelector = '[placeholder="Account 2"]';

  private readonly addAccountConfirmButtonSelector = 'button';

  private readonly accountItemSelector =
    '.multichain-account-list-item .multichain-account-list-item__account-name__button';

  constructor(driver: Driver) {
    this.driver = driver;
  }

  /**
   * Checks if the Account List page is loaded by verifying the presence of key elements.
   *
   * @throws Will throw an error if the page fails to load within the timeout period.
   */
  async check_pageIsLoaded(): Promise<void> {
    try {
      await this.driver.waitForMultipleSelectors([
        this.accountMenuIconSelector,
        this.createAccountButtonSelector,
      ]);
      console.log('Account List page is loaded');
    } catch (e) {
      console.error(
        'Timeout while waiting for Account List page to be loaded',
        e,
      );
      throw new Error('Account List page failed to load');
    }
  }

  /**
   * Creates a new account with the specified name.
   *
   * @param accountName - The name of the account to be created.
   * @throws Will throw an error if any step in the account creation process fails.
   */
  async createAccount(accountName: string): Promise<void> {
    console.log(`Creating new account: ${accountName}`);
    try {
      await this.driver.clickElement(this.accountMenuIconSelector);
      await this.driver.clickElement(this.createAccountButtonSelector);
      await this.driver.clickElement(this.addAccountButtonSelector);
      await this.driver.fill(this.accountNameInputSelector, accountName);
      await this.driver.clickElement({
        text: 'Create',
        tag: this.addAccountConfirmButtonSelector,
      });
      console.log(`Account created successfully: ${accountName}`);
    } catch (error: unknown) {
      console.error(`Failed to create account: ${accountName}`, error);
      if (error instanceof Error) {
        throw new Error(
          `Failed to create account '${accountName}': ${error.message}`,
        );
      } else {
        throw new Error(`Failed to create account '${accountName}'`);
      }
    }
  }

  /**
   * Switches to the specified account.
   *
   * @param accountName - The name of the account to switch to.
   * @throws Will throw an error if the account switch fails.
   */
  async switchToAccount(accountName: string): Promise<void> {
    console.log(`Switching to account: ${accountName}`);
    try {
      await this.driver.clickElement(this.accountMenuIconSelector);
      await this.driver.clickElement({
        css: this.accountItemSelector,
        text: accountName,
      });
      console.log(`Successfully switched to account: ${accountName}`);
    } catch (error: unknown) {
      console.error(`Failed to switch to account: ${accountName}`, error);
      if (error instanceof Error) {
        throw new Error(
          `Failed to switch to account '${accountName}': ${error.message}`,
        );
      } else {
        throw new Error(`Failed to switch to account '${accountName}'`);
      }
    }
  }

  /**
   * Checks if an account with the specified name exists.
   *
   * @param accountName - The name of the account to check for existence.
   * @returns A boolean indicating whether the account exists.
   * @throws Will throw an error if the account existence check fails.
   */
  async check_accountExists(accountName: string): Promise<boolean> {
    console.log(`Checking if account exists: ${accountName}`);
    try {
      await this.driver.clickElement(this.accountMenuIconSelector);
      const accountExists = await this.driver.isElementPresent({
        css: this.accountItemSelector,
        text: accountName,
      });
      await this.driver.clickElement(this.accountMenuIconSelector); // Close the menu
      console.log(`Account '${accountName}' exists: ${accountExists}`);
      return accountExists;
    } catch (error) {
      console.error(`Failed to check if account exists: ${accountName}`, error);
      throw new Error(
        `Failed to check if account '${accountName}' exists: ${(error as Error).message}`,
      );
    }
  }
}

export default AccountListPage;
