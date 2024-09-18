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

  constructor(driver: Driver) {
    this.driver = driver;
    this.accountOptionsMenuButton =
      '[data-testid="account-list-item-menu-button"]';
    this.hideUnhideAccountButton = '[data-testid="account-list-menu-hide"]';
    this.pinUnpinAccountButton = '[data-testid="account-list-menu-pin"]';
    this.hiddenAccountsList = '[data-testid="hidden-accounts-list"]';
    this.pinnedIcon = '[data-testid="account-pinned-icon"]';
    this.accountListItem = {
      text: 'Account',
      css: '.multichain-account-menu-popover__list--menu-item',
    };
    this.hiddenAccountOptionsMenuButton =
      '.multichain-account-menu-popover__list--menu-item-hidden-account [data-testid="account-list-item-menu-button"]';
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

  async changeAccountLabel(newLabel: string): Promise<void> {
    console.log(`Changing account label to: ${newLabel}`);
    try {
      await this.driver.clickElement('[data-testid="account-list-menu-details"]');
      await this.driver.clickElement('[data-testid="editable-label-button"]');
      await this.driver.fill('input[placeholder="Account name"]', newLabel);
      await this.driver.clickElement('[data-testid="save-account-label-input"]');
      await this.driver.clickElement('button[aria-label="Close"]');
      console.log(`Account label changed to: ${newLabel}`);
    } catch (error) {
      console.error(`Failed to change account label to: ${newLabel}`, error);
      throw new Error(`Unable to change account label: ${(error as Error).message}`);
    }
  }

  async verifyAccountLabel(expectedLabel: string): Promise<void> {
    console.log(`Verifying account label: ${expectedLabel}`);
    try {
      await this.driver.findElement({
        css: '[data-testid="account-menu-icon"]',
        text: expectedLabel,
      });
      console.log(`Account label verified: ${expectedLabel}`);
    } catch (error) {
      console.error(`Failed to verify account label: ${expectedLabel}`, error);
      throw new Error(`Account label verification failed: ${(error as Error).message}`);
    }
  }

  async addNewAccountWithCustomLabel(customLabel: string): Promise<void> {
    console.log(`Adding new account with custom label: ${customLabel}`);
    try {
      await this.driver.clickElement('[data-testid="account-menu-icon"]');
      await this.driver.clickElement('[data-testid="multichain-account-menu-popover-action-button"]');
      await this.driver.clickElement('[data-testid="multichain-account-menu-popover-add-account"]');
      await this.driver.fill('[placeholder="Account 2"]', customLabel);
      await this.driver.clickElementAndWaitToDisappear({
        text: 'Add account',
        tag: 'button',
      });
      console.log(`New account added with custom label: ${customLabel}`);
    } catch (error) {
      console.error(`Failed to add new account with custom label: ${customLabel}`, error);
      throw new Error(`Unable to add new account with custom label: ${(error as Error).message}`);
    }
  }
}

export default AccountListPage;
