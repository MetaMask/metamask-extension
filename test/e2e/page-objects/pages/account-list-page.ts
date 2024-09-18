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

  async check_pageIsLoaded(): Promise<void> {
    console.log('Checking if Account List page is loaded');
    try {
      await this.driver.waitForMultipleSelectors([
        this.accountListItem,
        this.accountOptionsMenuButton,
      ]);
      console.log('Account List page is loaded');
    } catch (e) {
      console.error('Timeout while waiting for Account List page to be loaded', e);
      throw new Error('Account List page failed to load');
    }
  }

  async hideAccount(): Promise<void> {
    console.log('Hiding account in account list');
    try {
      await this.driver.clickElement(this.hideUnhideAccountButton);
      console.log('Account hidden successfully');
    } catch (e) {
      console.error('Failed to hide account', e);
      throw new Error('Unable to hide account');
    }
  }

  async openAccountOptionsMenu(): Promise<void> {
    console.log('Opening account options menu');
    try {
      await this.driver.clickElement(this.accountOptionsMenuButton);
      console.log('Account options menu opened successfully');
    } catch (e) {
      console.error('Failed to open account options menu', e);
      throw new Error('Unable to open account options menu');
    }
  }

  async openHiddenAccountOptions(): Promise<void> {
    console.log('Opening hidden accounts options menu');
    try {
      await this.driver.clickElement(this.hiddenAccountOptionsMenuButton);
      console.log('Hidden accounts options menu opened successfully');
    } catch (e) {
      console.error('Failed to open hidden accounts options menu', e);
      throw new Error('Unable to open hidden accounts options menu');
    }
  }

  async openHiddenAccountsList(): Promise<void> {
    console.log('Opening hidden accounts list');
    try {
      await this.driver.clickElement(this.hiddenAccountsList);
      console.log('Hidden accounts list opened successfully');
    } catch (e) {
      console.error('Failed to open hidden accounts list', e);
      throw new Error('Unable to open hidden accounts list');
    }
  }

  async pinAccount(): Promise<void> {
    console.log('Pinning account in account list');
    try {
      await this.driver.clickElement(this.pinUnpinAccountButton);
      console.log('Account pinned successfully');
    } catch (e) {
      console.error('Failed to pin account', e);
      throw new Error('Unable to pin account');
    }
  }

  async unhideAccount(): Promise<void> {
    console.log('Unhiding account in account list');
    try {
      await this.driver.clickElement(this.hideUnhideAccountButton);
      console.log('Account unhidden successfully');
    } catch (e) {
      console.error('Failed to unhide account', e);
      throw new Error('Unable to unhide account');
    }
  }

  async unpinAccount(): Promise<void> {
    console.log('Unpinning account in account list');
    try {
      await this.driver.clickElement(this.pinUnpinAccountButton);
      console.log('Account unpinned successfully');
    } catch (e) {
      console.error('Failed to unpin account', e);
      throw new Error('Unable to unpin account');
    }
  }

  async check_accountIsDisplayed(): Promise<void> {
    console.log('Checking if account is displayed in account list');
    try {
      await this.driver.waitForSelector(this.accountListItem);
      console.log('Account is displayed in account list');
    } catch (e) {
      console.error('Account is not displayed in account list', e);
      throw new Error('Account is not displayed in account list');
    }
  }

  async check_accountIsPinned(): Promise<void> {
    console.log('Checking if account is pinned');
    try {
      await this.driver.waitForSelector(this.pinnedIcon);
      console.log('Account is pinned');
    } catch (e) {
      console.error('Account is not pinned', e);
      throw new Error('Account is not pinned');
    }
  }

  async check_accountIsUnpinned(): Promise<void> {
    console.log('Checking if account is unpinned');
    try {
      await this.driver.assertElementNotPresent(this.pinnedIcon);
      console.log('Account is unpinned');
    } catch (e) {
      console.error('Account is still pinned', e);
      throw new Error('Account is still pinned');
    }
  }

  async check_hiddenAccountsListExists(): Promise<void> {
    console.log('Checking if hidden accounts list exists');
    try {
      await this.driver.waitForSelector(this.hiddenAccountsList);
      console.log('Hidden accounts list exists');
    } catch (e) {
      console.error('Hidden accounts list does not exist', e);
      throw new Error('Hidden accounts list does not exist');
    }
  }
}

export default AccountListPage;
