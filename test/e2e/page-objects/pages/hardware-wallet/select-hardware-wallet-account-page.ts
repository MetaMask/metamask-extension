import { Driver } from '../../../webdriver/driver';

/**
 * Hardware wallet account list: pick accounts to unlock or forget the device.
 *
 * Screen: account-selection step after `#/new-account/connect` device connect.
 * Owns: page-loaded checks, counting/displayed addresses, unlocking selected
 * accounts, cancel, and forget-device.
 * Boundaries: the account list only. Device-type selection is
 * `ConnectHardwareWalletPage`; wallet UI after unlock is outside this object.
 * Related: `ConnectHardwareWalletPage` (how tests get here).
 *
 * @see ui/pages/create-account/connect-hardware/select-hardware-accounts-page/select-hardware-accounts-page.tsx
 */
class SelectHardwareWalletAccountPage {
  protected readonly accountCheckbox = '.hw-account-list__item__checkbox';

  protected readonly cancelButton = {
    testId: 'connect-hardware-account-list-cancel-btn',
  };

  protected driver: Driver;

  protected readonly forgetDeviceButton =
    '[data-testid="hardware-forget-device-button"]';

  protected readonly selectAccountPageTitle = {
    text: 'Select an account',
    tag: 'h3',
  };

  protected readonly unlockButton = {
    testId: 'connect-hardware-account-list-unlock-btn',
  };

  constructor(driver: Driver) {
    this.driver = driver;
  }

  /**
   * This function checks if the specified number of account items is displayed in the account list.
   *
   * @param expectedNumber - The number of account items expected to be displayed. Defaults to 5.
   * @returns A promise that resolves if the expected number of account items is displayed.
   */
  async checkAccountNumber(expectedNumber: number = 5): Promise<void> {
    console.log(`Waiting for ${expectedNumber} account items to be displayed`);
    await this.driver.wait(async () => {
      const accountItems = await this.driver.findElements(this.accountCheckbox);
      return accountItems.length === expectedNumber;
    }, 10000);
    console.log(
      `Expected number of account items ${expectedNumber} is displayed.`,
    );
  }

  /**
   * Check that the specified address is displayed in the list of accounts.
   *
   * @param address - The address to check for.
   */
  async checkAddressIsDisplayed(address: string): Promise<void> {
    console.log(
      `Check that account address ${address} is displayed on select account page`,
    );
    await this.driver.waitForSelector({ text: address });
  }

  async checkPageIsLoaded(): Promise<void> {
    try {
      await this.driver.waitForMultipleSelectors([
        this.selectAccountPageTitle,
        this.cancelButton,
      ]);
    } catch (e) {
      console.log(
        'Timeout while waiting for select account page to be loaded',
        e,
      );
      throw e;
    }
    console.log('Select account page is loaded');
  }

  async clickForgetDeviceButton(): Promise<void> {
    console.log(`Click forget device button on select account page`);
    await this.driver.clickElement(this.forgetDeviceButton);
  }

  async clickUnlockButton(): Promise<void> {
    console.log(`Click unlock button on select account page`);
    await this.driver.clickElement(this.unlockButton);
  }

  async selectAccount(accountIndex: number): Promise<void> {
    console.log(`Select account ${accountIndex}`);
    await this.driver.clickElement(`label[for="address-${accountIndex - 1}"]`);
  }

  async unlockAccount(accountIndex: number): Promise<void> {
    console.log(`Unlock account ${accountIndex}`);
    await this.selectAccount(accountIndex);
    await this.clickUnlockButton();
  }
}

export default SelectHardwareWalletAccountPage;
