import { Driver } from '../../../webdriver/driver';

/**
 * Represents the select trezor hardware wallet account page.
 * This page allows users to select Trezor accounts to connect.
 */
class SelectTrezorAccountPage {
  private driver: Driver;

  private readonly cancelButton = { text: 'Cancel', tag: 'button' };

  private readonly selectTrezorAccountPageTitle = {
    text: 'Select an account',
    tag: 'h3',
  };

  private readonly trezorAccountCheckbox = '.hw-account-list__item__checkbox';

  private readonly unlockButton = { text: 'Unlock', tag: 'button' };

  constructor(driver: Driver) {
    this.driver = driver;
  }

  async check_pageIsLoaded(): Promise<void> {
    try {
      await this.driver.waitForMultipleSelectors([
        this.selectTrezorAccountPageTitle,
        this.cancelButton,
      ]);
    } catch (e) {
      console.log(
        'Timeout while waiting for select trezor account page to be loaded',
        e,
      );
      throw e;
    }
    console.log('Select trezor account page is loaded');
  }

  async clickUnlockButton(): Promise<void> {
    console.log(`Click unlock button on select trezor account page`);
    await this.driver.clickElement(this.unlockButton);
  }

  async selectTrezorAccount(accountIndex: number): Promise<void> {
    console.log(`Select trezor account ${accountIndex}`);
    const accountCheckboxes = await this.driver.findElements(
      this.trezorAccountCheckbox,
    );
    await accountCheckboxes[accountIndex - 1].click();
  }

  async unlockAccount(accountIndex: number): Promise<void> {
    console.log(`Unlock trezor account ${accountIndex}`);
    await this.selectTrezorAccount(accountIndex);
    await this.clickUnlockButton();
  }

  /**
   * Check that the specified address is displayed in the list of accounts.
   *
   * @param address - The address to check for.
   */
  async check_addressIsDisplayed(address: string): Promise<void> {
    console.log(
      `Check that account address ${address} is displayed on select trezor account page`,
    );
    await this.driver.waitForSelector({ text: address });
  }

  /**
   * This function checks if the specified number of trezor account items is displayed in the trezor account list.
   *
   * @param expectedNumber - The number of trezor account items expected to be displayed. Defaults to 5.
   * @returns A promise that resolves if the expected number of trezor account items is displayed.
   */
  async check_trezorAccountNumber(expectedNumber: number = 5): Promise<void> {
    console.log(
      `Waiting for ${expectedNumber} trezor account items to be displayed`,
    );
    await this.driver.wait(async () => {
      const trezorAccountItems = await this.driver.findElements(
        this.trezorAccountCheckbox,
      );
      return trezorAccountItems.length === expectedNumber;
    }, 10000);
    console.log(
      `Expected number of trezor account items ${expectedNumber} is displayed.`,
    );
  }
}

export default SelectTrezorAccountPage;
