import { Driver } from '../../../webdriver/driver';

/**
 * Represents the select hardware wallet account page.
 * This page allows users to select accounts to connect.
 */
class SelectHardwareWalletAccountPage {
  protected driver: Driver;

  protected readonly cancelButton = { text: 'Cancel', tag: 'button' };

  protected readonly selectAccountPageTitle = {
    text: 'Select an account',
    tag: 'h3',
  };

  protected readonly accountCheckbox = '.hw-account-list__item__checkbox';

  protected readonly unlockButton = { text: 'Unlock', tag: 'button' };

  constructor(driver: Driver) {
    this.driver = driver;
  }

  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  async check_pageIsLoaded(): Promise<void> {
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

  async clickUnlockButton(): Promise<void> {
    console.log(`Click unlock button on select account page`);
    await this.driver.clickElement(this.unlockButton);
  }

  async selectAccount(accountIndex: number): Promise<void> {
    console.log(`Select account ${accountIndex}`);
    const accountCheckboxes = await this.driver.findElements(
      this.accountCheckbox,
    );
    await accountCheckboxes[accountIndex - 1].click();
  }

  async unlockAccount(accountIndex: number): Promise<void> {
    console.log(`Unlock account ${accountIndex}`);
    await this.selectAccount(accountIndex);
    await this.clickUnlockButton();
  }

  /**
   * Check that the specified address is displayed in the list of accounts.
   *
   * @param address - The address to check for.
   */
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  async check_addressIsDisplayed(address: string): Promise<void> {
    console.log(
      `Check that account address ${address} is displayed on select account page`,
    );
    await this.driver.waitForSelector({ text: address });
  }

  /**
   * This function checks if the specified number of account items is displayed in the account list.
   *
   * @param expectedNumber - The number of account items expected to be displayed. Defaults to 5.
   * @returns A promise that resolves if the expected number of account items is displayed.
   */
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  async check_accountNumber(expectedNumber: number = 5): Promise<void> {
    console.log(`Waiting for ${expectedNumber} account items to be displayed`);
    await this.driver.wait(async () => {
      const accountItems = await this.driver.findElements(this.accountCheckbox);
      return accountItems.length === expectedNumber;
    }, 10000);
    console.log(
      `Expected number of account items ${expectedNumber} is displayed.`,
    );
  }
}

export default SelectHardwareWalletAccountPage;
