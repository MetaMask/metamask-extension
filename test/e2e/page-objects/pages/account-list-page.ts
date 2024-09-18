import { Driver } from '../../webdriver/driver';

class AccountListPage {
  private driver: Driver;

  private accountListItem: object;
  private accountOptionsMenuButton: string;
  private hideUnhideAccountButton: string;
  private hiddenAccountsList: string;
  private hiddenAccountOptionsMenuButton: string;
  private pinnedIcon: string;
  private pinUnpinAccountButton: string;
  private accountMenuIcon: string;
  private createAccountButtonSelector: string;
  private addAccountButtonSelector: string;
  private accountNameInputSelector: string;
  private addAccountConfirmButtonSelector: string;

  constructor(driver: Driver) {
    this.driver = driver;
    this.accountOptionsMenuButton = '[data-testid="account-list-item-menu-button"]';
    this.hideUnhideAccountButton = '[data-testid="account-list-menu-hide"]';
    this.pinUnpinAccountButton = '[data-testid="account-list-menu-pin"]';
    this.hiddenAccountsList = '[data-testid="hidden-accounts-list"]';
    this.pinnedIcon = '[data-testid="account-pinned-icon"]';
    this.accountListItem = {
      text: 'Account',
      css: '.multichain-account-menu-popover__list--menu-item',
    };
    this.hiddenAccountOptionsMenuButton = '.multichain-account-menu-popover__list--menu-item-hidden-account [data-testid="account-list-item-menu-button"]';
    this.accountMenuIcon = '[data-testid="account-menu-icon"]';
    this.createAccountButtonSelector = '[data-testid="multichain-account-menu-popover-action-button"]';
    this.addAccountButtonSelector = '[data-testid="multichain-account-menu-popover-add-account"]';
    this.accountNameInputSelector = '[placeholder="Account 2"]';
    this.addAccountConfirmButtonSelector = 'button';
  }

  async openAccountMenu(): Promise<void> {
    console.log('Opening account menu');
    try {
      await this.driver.clickElement(this.accountMenuIcon);
      console.log('Account menu opened successfully');
    } catch (error) {
      console.error('Failed to open account menu', error);
      throw new Error(`Unable to open account menu: ${(error as Error).message}`);
    }
  }

  async check_pageIsLoaded(): Promise<void> {
    try {
      await this.driver.waitForMultipleSelectors([
        this.accountListItem,
        this.accountOptionsMenuButton,
      ]);
    } catch (e) {
      console.log('Timeout while waiting for account list to be loaded', e);
      throw e;
    }
    console.log('Account list is loaded');
  }

  async hideAccount(): Promise<void> {
    console.log(`Hide account in account list`);
    await this.driver.clickElement(this.hideUnhideAccountButton);
  }

  async openAccountOptionsMenu(): Promise<void> {
    console.log(`Open account option menu`);
    await this.driver.clickElement(this.accountOptionsMenuButton);
  }

  async openHiddenAccountOptions(): Promise<void> {
    console.log(`Open hidden accounts options menu`);
    await this.driver.clickElement(this.hiddenAccountOptionsMenuButton);
  }

  async openHiddenAccountsList(): Promise<void> {
    console.log(`Open hidden accounts option menu`);
    await this.driver.clickElement(this.hiddenAccountsList);
  }

  async pinAccount(): Promise<void> {
    console.log(`Pin account in account list`);
    await this.driver.clickElement(this.pinUnpinAccountButton);
  }

  async unhideAccount(): Promise<void> {
    console.log(`Unhide account in account list`);
    await this.driver.clickElement(this.hideUnhideAccountButton);
  }

  async unpinAccount(): Promise<void> {
    console.log(`Unpin account in account list`);
    await this.driver.clickElement(this.pinUnpinAccountButton);
  }

  async check_accountIsDisplayed(): Promise<void> {
    console.log(`Check that account is displayed in account list`);
    await this.driver.waitForSelector(this.accountListItem);
  }

  async check_accountIsPinned(): Promise<void> {
    console.log(`Check that account is pinned`);
    await this.driver.waitForSelector(this.pinnedIcon);
  }

  async check_accountIsUnpinned(): Promise<void> {
    console.log(`Check that account is unpinned`);
    await this.driver.assertElementNotPresent(this.pinnedIcon);
  }

  async check_hiddenAccountsListExists(): Promise<void> {
    console.log(`Check that hidden accounts list is displayed in account list`);
    await this.driver.waitForSelector(this.hiddenAccountsList);
  }

  /**
   * Changes the label of the currently selected account.
   * @param newLabel - The new label to set for the account.
   * @throws Will throw an error if any step in the account label change process fails.
   */
  async changeAccountLabel(newLabel: string): Promise<void> {
    console.log(`Changing account label to: ${newLabel}`);
    try {
      await this.driver.waitForSelector(this.accountOptionsMenuButton);
      await this.driver.clickElement(this.accountOptionsMenuButton);
      await this.driver.waitForSelector('[data-testid="account-list-menu-details"]');
      await this.driver.clickElement('[data-testid="account-list-menu-details"]');
      await this.driver.waitForSelector('[data-testid="editable-label-button"]');
      await this.driver.clickElement('[data-testid="editable-label-button"]');
      await this.driver.waitForSelector('[data-testid="editable-label-input"]');
      await this.driver.fill('[data-testid="editable-label-input"]', newLabel);
      await this.driver.waitForSelector('[data-testid="save-account-label-input"]');
      await this.driver.clickElement('[data-testid="save-account-label-input"]');
      await this.driver.waitForSelector('button[aria-label="Close"]');
      await this.driver.clickElement('button[aria-label="Close"]');

      // Verify the label change
      await this.verifyAccountLabel(newLabel);
      console.log(`Account label changed to: ${newLabel}`);
    } catch (error) {
      console.error(`Failed to change account label to: ${newLabel}`, error);
      throw new Error(`Unable to change account label: ${(error as Error).message}`);
    }
  }

  /**
   * Verifies that the account label matches the expected label.
   * @param expectedLabel - The expected label of the account.
   * @throws Will throw an error if the account label verification fails.
   */
  async verifyAccountLabel(expectedLabel: string): Promise<void> {
    console.log(`Verifying account label: ${expectedLabel}`);
    try {
      const accountMenuIconSelector = '[data-testid="account-menu-icon"]';
      await this.driver.waitForSelector(accountMenuIconSelector);
      const accountLabel = await this.driver.findElement({
        css: accountMenuIconSelector,
        text: expectedLabel,
      });
      const actualLabel = await accountLabel.getText();
      if (actualLabel !== expectedLabel) {
        throw new Error(`Account label mismatch. Expected: ${expectedLabel}, Actual: ${actualLabel}`);
      }
      console.log(`Account label verified successfully: ${expectedLabel}`);
    } catch (error) {
      console.error(`Failed to verify account label: ${expectedLabel}`, error);
      throw new Error(`Account label verification failed: ${(error as Error).message}`);
    }
  }

  /**
   * Adds a new account with a custom label.
   * This method opens the account menu, initiates the account creation process,
   * sets a custom label for the new account, and verifies its creation.
   *
   * @param customLabel - The custom label for the new account.
   * @throws Will throw an error if any step in the account creation process fails,
   *         including menu navigation, account creation, or label verification.
   */
  async addNewAccountWithCustomLabel(customLabel: string): Promise<void> {
    console.log(`Adding new account with custom label: ${customLabel}`);
    try {
      await this.openAccountMenu();
      await this.driver.waitForSelector(this.createAccountButtonSelector);
      await this.driver.clickElement(this.createAccountButtonSelector);
      await this.driver.waitForSelector(this.addAccountButtonSelector);
      await this.driver.clickElement(this.addAccountButtonSelector);
      await this.driver.waitForSelector(this.accountNameInputSelector);
      await this.driver.fill(this.accountNameInputSelector, customLabel);
      await this.driver.clickElementAndWaitToDisappear({
        text: 'Add account',
        tag: this.addAccountConfirmButtonSelector,
      });

      // Verify the new account was added with the correct label
      await this.verifyAccountLabel(customLabel);
      console.log(`New account added and verified with custom label: ${customLabel}`);
    } catch (error) {
      console.error(`Failed to add new account with custom label: ${customLabel}`, error);
      throw new Error(`Unable to add new account with custom label: ${(error as Error).message}`);
    }
  }

  /**
   * Closes the account menu.
   * This method waits for the close button to be visible, clicks it, and verifies that the menu is closed.
   * @throws Will throw an error if the account menu fails to close or if the close button is not found.
   */
  async closeAccountMenu(): Promise<void> {
    console.log('Closing account menu');
    try {
      const closeButtonSelector = 'button[aria-label="Close"]';
      await this.driver.waitForSelector(closeButtonSelector);
      await this.driver.clickElement(closeButtonSelector);

      // Verify that the menu is closed by checking that the close button is no longer present
      await this.driver.assertElementNotPresent(closeButtonSelector);
      console.log('Account menu closed successfully');
    } catch (error) {
      console.error('Failed to close account menu', error);
      throw new Error(`Unable to close account menu: ${(error as Error).message}`);
    }
  }
}

export default AccountListPage;
