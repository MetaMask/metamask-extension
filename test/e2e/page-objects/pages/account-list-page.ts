import { strict as assert } from 'assert';
import { Driver } from '../../webdriver/driver';
import { largeDelayMs } from '../../helpers';
import messages from '../../../../app/_locales/en/messages.json';

class AccountListPage {
  private readonly driver: Driver;

  private readonly accountAddressText = '.qr-code__address-segments';

  private readonly accountListBalance =
    '[data-testid="second-currency-display"]';

  private readonly accountListItem =
    '.multichain-account-menu-popover__list--menu-item';

  private readonly accountMenuButton =
    '[data-testid="account-list-menu-details"]';

  private readonly accountNameInput = '#account-name';

  private readonly accountOptionsMenuButton =
    '[data-testid="account-list-item-menu-button"]';

  private readonly accountQrCodeImage = '.qr-code__wrapper';

  private readonly accountQrCodeAddress = '.qr-code__address-segments';

  private readonly addAccountConfirmButton =
    '[data-testid="submit-add-account-with-name"]';

  private readonly addBtcAccountButton = {
    text: messages.addNewBitcoinAccount.message,
    tag: 'button',
  };

  private readonly addEthereumAccountButton =
    '[data-testid="multichain-account-menu-popover-add-account"]';

  private readonly addImportedAccountButton =
    '[data-testid="multichain-account-menu-popover-add-imported-account"]';

  private readonly addSnapAccountButton = {
    text: 'Add account Snap',
    tag: 'button',
  };

  private readonly closeAccountModalButton = 'button[aria-label="Close"]';

  private readonly createAccountButton =
    '[data-testid="multichain-account-menu-popover-action-button"]';

  private readonly currentSelectedAccount =
    '.multichain-account-list-item--selected';

  private readonly editableLabelButton =
    '[data-testid="editable-label-button"]';

  private readonly editableLabelInput = '[data-testid="editable-input"] input';

  private readonly hiddenAccountOptionsMenuButton =
    '.multichain-account-menu-popover__list--menu-item-hidden-account [data-testid="account-list-item-menu-button"]';

  private readonly hiddenAccountsList = '[data-testid="hidden-accounts-list"]';

  private readonly hideUnhideAccountButton =
    '[data-testid="account-list-menu-hide"]';

  private readonly importAccountConfirmButton =
    '[data-testid="import-account-confirm-button"]';

  private readonly importAccountPrivateKeyInput = '#private-key-box';

  private readonly importAccountDropdownOption = '.dropdown__select';

  private readonly importAccountJsonFileOption = {
    text: 'JSON File',
    tag: 'option',
  };

  private readonly importAccountJsonFileInput =
    'input[data-testid="file-input"]';

  private readonly importAccountJsonPasswordInput =
    'input[id="json-password-box"]';

  private readonly pinUnpinAccountButton =
    '[data-testid="account-list-menu-pin"]';

  private readonly pinnedIcon = '[data-testid="account-pinned-icon"]';

  private readonly removeAccountButton =
    '[data-testid="account-list-menu-remove"]';

  private readonly removeAccountConfirmButton = {
    text: 'Remove',
    tag: 'button',
  };

  private readonly removeAccountMessage = {
    text: 'Remove account?',
    tag: 'div',
  };

  private readonly removeAccountNevermindButton = {
    text: 'Nevermind',
    tag: 'button',
  };

  private readonly saveAccountLabelButton =
    '[data-testid="save-account-label-input"]';

  constructor(driver: Driver) {
    this.driver = driver;
  }

  async check_pageIsLoaded(): Promise<void> {
    try {
      await this.driver.waitForMultipleSelectors([
        this.createAccountButton,
        this.accountOptionsMenuButton,
      ]);
    } catch (e) {
      console.log('Timeout while waiting for account list to be loaded', e);
      throw e;
    }
    console.log('Account list is loaded');
  }

  /**
   * Adds a new account with an optional custom label.
   *
   * @param customLabel - The custom label for the new account. If not provided, a default name will be used.
   */
  async addNewAccount(customLabel?: string): Promise<void> {
    if (customLabel) {
      console.log(`Adding new account with custom label: ${customLabel}`);
    } else {
      console.log(`Adding new account with default name`);
    }
    await this.driver.clickElement(this.createAccountButton);
    await this.driver.clickElement(this.addEthereumAccountButton);
    if (customLabel) {
      await this.driver.fill(this.accountNameInput, customLabel);
    }
    // needed to mitigate a race condition with the state update
    // there is no condition we can wait for in the UI
    await this.driver.delay(largeDelayMs);
    await this.driver.clickElementAndWaitToDisappear(
      this.addAccountConfirmButton,
    );
  }

  /**
   * Adds a new BTC account with an optional custom name.
   *
   * @param options - Options for adding a new BTC account.
   * @param [options.btcAccountCreationEnabled] - Indicates if the BTC account creation is expected to be enabled or disabled. Defaults to true.
   * @param [options.accountName] - The custom name for the BTC account. Defaults to an empty string, which means the default name will be used.
   */
  async addNewBtcAccount({
    btcAccountCreationEnabled = true,
    accountName = '',
  }: {
    btcAccountCreationEnabled?: boolean;
    accountName?: string;
  } = {}): Promise<void> {
    console.log(
      `Adding new BTC account${
        accountName ? ` with custom name: ${accountName}` : ' with default name'
      }`,
    );
    await this.driver.clickElement(this.createAccountButton);
    if (btcAccountCreationEnabled) {
      await this.driver.clickElement(this.addBtcAccountButton);
      // needed to mitigate a race condition with the state update
      // there is no condition we can wait for in the UI
      await this.driver.delay(largeDelayMs);
      if (accountName) {
        await this.driver.fill(this.accountNameInput, accountName);
      }
      await this.driver.clickElementAndWaitToDisappear(
        this.addAccountConfirmButton,
        // Longer timeout than usual, this reduces the flakiness
        // around Bitcoin account creation (mainly required for
        // Firefox)
        5000,
      );
    } else {
      const createButton = await this.driver.findElement(
        this.addBtcAccountButton,
      );
      assert.equal(await createButton.isEnabled(), false);
      await this.driver.clickElement(this.closeAccountModalButton);
    }
  }

  /**
   * Import a new account with a private key.
   *
   * @param privateKey - Private key of the account
   * @param expectedErrorMessage - Expected error message if the import should fail
   */
  async addNewImportedAccount(
    privateKey: string,
    expectedErrorMessage?: string,
  ): Promise<void> {
    console.log(`Adding new imported account`);
    await this.driver.clickElement(this.createAccountButton);
    await this.driver.clickElement(this.addImportedAccountButton);
    await this.driver.fill(this.importAccountPrivateKeyInput, privateKey);
    if (expectedErrorMessage) {
      await this.driver.clickElement(this.importAccountConfirmButton);
      await this.driver.waitForSelector({
        css: '.mm-help-text',
        text: expectedErrorMessage,
      });
    } else {
      await this.driver.clickElementAndWaitToDisappear(
        this.importAccountConfirmButton,
      );
    }
  }

  /**
   * Changes the label of the current account.
   *
   * @param newLabel - The new label to set for the account.
   */
  async changeAccountLabel(newLabel: string): Promise<void> {
    console.log(`Changing account label to: ${newLabel}`);
    await this.driver.clickElement(this.accountMenuButton);
    await this.changeLabelFromAccountDetailsModal(newLabel);
  }

  /**
   * Changes the account label from within an already opened account details modal.
   * Note: This method assumes the account details modal is already open.
   *
   * Recommended usage:
   * ```typescript
   * await accountListPage.openAccountDetailsModal('Current Account Name');
   * await accountListPage.changeLabelFromAccountDetailsModal('New Account Name');
   * ```
   *
   * @param newLabel - The new label to set for the account
   * @throws Will throw an error if the modal is not open when method is called
   * @example
   * // To rename a specific account, first open its details modal:
   * await accountListPage.openAccountDetailsModal('Current Account Name');
   * await accountListPage.changeLabelFromAccountDetailsModal('New Account Name');
   *
   * // Note: Using changeAccountLabel() alone will only work for the first account
   */
  async changeLabelFromAccountDetailsModal(newLabel: string): Promise<void> {
    await this.driver.waitForSelector(this.editableLabelButton);
    console.log(
      `Account details modal opened, changing account label to: ${newLabel}`,
    );
    await this.driver.clickElement(this.editableLabelButton);
    await this.driver.fill(this.editableLabelInput, newLabel);
    await this.driver.clickElement(this.saveAccountLabelButton);
    await this.driver.clickElement(this.closeAccountModalButton);
  }

  async closeAccountModal(): Promise<void> {
    console.log(`Close account modal in account list`);
    await this.driver.clickElementAndWaitToDisappear(
      this.closeAccountModalButton,
    );
  }

  /**
   * Get the address of the specified account.
   *
   * @param accountLabel - The label of the account to get the address.
   */
  async getAccountAddress(accountLabel: string): Promise<string> {
    console.log(`Get account address in account list`);
    await this.openAccountOptionsInAccountList(accountLabel);
    await this.driver.clickElement(this.accountMenuButton);
    await this.driver.waitForSelector(this.accountAddressText);
    const accountAddress = await (
      await this.driver.findElement(this.accountAddressText)
    ).getText();
    await this.driver.clickElement(this.closeAccountModalButton);
    return accountAddress;
  }

  async hideAccount(): Promise<void> {
    console.log(`Hide account in account list`);
    await this.driver.clickElement(this.hideUnhideAccountButton);
  }

  /**
   * Import an account with a JSON file.
   *
   * @param jsonFilePath - Path to the JSON file to import
   * @param password - Password for the imported account
   */
  async importAccountWithJsonFile(
    jsonFilePath: string,
    password: string,
  ): Promise<void> {
    console.log(`Adding new imported account`);
    await this.driver.clickElement(this.createAccountButton);
    await this.driver.clickElement(this.addImportedAccountButton);
    await this.driver.clickElement(this.importAccountDropdownOption);
    await this.driver.clickElement(this.importAccountJsonFileOption);

    const fileInput = await this.driver.findElement(
      this.importAccountJsonFileInput,
    );
    await fileInput.sendKeys(jsonFilePath);
    await this.driver.fill(this.importAccountJsonPasswordInput, password);
    await this.driver.clickElementAndWaitToDisappear(
      this.importAccountConfirmButton,
    );
  }

  /**
   * Open the account details modal for the specified account in account list.
   *
   * @param accountLabel - The label of the account to open the details modal for.
   */
  async openAccountDetailsModal(accountLabel: string): Promise<void> {
    console.log(
      `Open account details modal in account list for account ${accountLabel}`,
    );
    await this.openAccountOptionsInAccountList(accountLabel);
    await this.driver.clickElement(this.accountMenuButton);
  }

  /**
   * Open the account options menu for the specified account.
   *
   * @param accountLabel - The label of the account to open the options menu for.
   */
  async openAccountOptionsInAccountList(accountLabel: string): Promise<void> {
    console.log(
      `Open account options in account list for account ${accountLabel}`,
    );
    await this.driver.clickElement(
      `button[data-testid="account-list-item-menu-button"][aria-label="${accountLabel} Options"]`,
    );
  }

  async openAccountOptionsMenu(): Promise<void> {
    console.log(`Open account option menu`);
    await this.driver.waitForSelector(this.accountListItem);
    await this.driver.clickElement(this.accountOptionsMenuButton);
  }

  async openAddAccountModal(): Promise<void> {
    console.log(`Open add account modal in account list`);
    await this.driver.clickElement(this.createAccountButton);
    await this.driver.waitForSelector(this.addEthereumAccountButton);
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

  /**
   * Remove the specified account from the account list.
   *
   * @param accountLabel - The label of the account to remove.
   * @param confirmRemoval - Whether to confirm the removal of the account. Defaults to true.
   */
  async removeAccount(
    accountLabel: string,
    confirmRemoval: boolean = true,
  ): Promise<void> {
    console.log(`Remove account in account list`);
    await this.openAccountOptionsInAccountList(accountLabel);
    await this.driver.clickElement(this.removeAccountButton);
    await this.driver.waitForSelector(this.removeAccountMessage);
    if (confirmRemoval) {
      console.log('Confirm removal of account');
      await this.driver.clickElement(this.removeAccountConfirmButton);
    } else {
      console.log('Click nevermind button to cancel account removal');
      await this.driver.clickElement(this.removeAccountNevermindButton);
    }
  }

  async switchToAccount(expectedLabel: string): Promise<void> {
    console.log(
      `Switch to account with label ${expectedLabel} in account list`,
    );
    await this.driver.clickElement({
      css: this.accountListItem,
      text: expectedLabel,
    });
  }

  async unhideAccount(): Promise<void> {
    console.log(`Unhide account in account list`);
    await this.driver.clickElement(this.hideUnhideAccountButton);
  }

  async unpinAccount(): Promise<void> {
    console.log(`Unpin account in account list`);
    await this.driver.clickElement(this.pinUnpinAccountButton);
  }

  /**
   * Checks that the account balance is displayed in the account list.
   *
   * @param expectedBalance - The expected balance to check.
   */
  async check_accountBalanceDisplayed(expectedBalance: string): Promise<void> {
    console.log(
      `Check that account balance ${expectedBalance} is displayed in account list`,
    );
    await this.driver.waitForSelector({
      css: this.accountListBalance,
      text: expectedBalance,
    });
  }

  async check_accountDisplayedInAccountList(
    expectedLabel: string = 'Account',
  ): Promise<void> {
    console.log(
      `Check that account label ${expectedLabel} is displayed in account list`,
    );
    await this.driver.waitForSelector({
      css: this.accountListItem,
      text: expectedLabel,
    });
  }

  /**
   * Checks that the account with the specified label is not displayed in the account list.
   *
   * @param expectedLabel - The label of the account that should not be displayed.
   */
  async check_accountIsNotDisplayedInAccountList(
    expectedLabel: string,
  ): Promise<void> {
    console.log(
      `Check that account label ${expectedLabel} is not displayed in account list`,
    );
    await this.driver.assertElementNotPresent({
      css: this.accountListItem,
      text: expectedLabel,
    });
  }

  async check_accountIsPinned(): Promise<void> {
    console.log(`Check that account is pinned`);
    await this.driver.waitForSelector(this.pinnedIcon);
  }

  async check_accountIsUnpinned(): Promise<void> {
    console.log(`Check that account is unpinned`);
    await this.driver.assertElementNotPresent(this.pinnedIcon);
  }

  async check_addAccountSnapButtonIsDisplayed(): Promise<void> {
    console.log('Check add account snap button is displayed');
    await this.driver.waitForSelector(this.addSnapAccountButton);
  }

  async check_addAccountSnapButtonNotPresent(): Promise<void> {
    console.log('Check add account snap button is not present');
    await this.driver.assertElementNotPresent(this.addSnapAccountButton);
  }

  /**
   * Check that the correct address is displayed in the account details modal.
   *
   * @param expectedAddress - The expected address to check.
   */
  async check_addressInAccountDetailsModal(
    expectedAddress: string,
  ): Promise<void> {
    console.log(
      `Check that address ${expectedAddress} is displayed in account details modal`,
    );
    await this.driver.waitForSelector(this.accountQrCodeImage);
    await this.driver.waitForSelector({
      css: this.accountQrCodeAddress,
      text: expectedAddress,
    });
  }

  async check_currentAccountIsImported(): Promise<void> {
    console.log(`Check that current account is an imported account`);
    await this.driver.waitForSelector({
      css: this.currentSelectedAccount,
      text: 'Imported',
    });
  }

  async check_hiddenAccountsListExists(): Promise<void> {
    console.log(`Check that hidden accounts list is displayed in account list`);
    await this.driver.waitForSelector(this.hiddenAccountsList);
  }

  /**
   * Verifies number of accounts currently showing in the accounts menu.
   *
   * @param expectedNumberOfAccounts - The expected number of accounts showing.
   */
  async check_numberOfAvailableAccounts(
    expectedNumberOfAccounts: number,
  ): Promise<void> {
    console.log(
      `Verify the number of accounts in the account menu is: ${expectedNumberOfAccounts}`,
    );
    await this.driver.wait(async () => {
      const internalAccounts = await this.driver.findElements(
        this.accountListItem,
      );
      return internalAccounts.length === expectedNumberOfAccounts;
    }, 20000);
  }

  /**
   * Check that the remove account button is not displayed in the account options menu for the specified account.
   *
   * @param accountLabel - The label of the account to check.
   */
  async check_removeAccountButtonIsNotDisplayed(
    accountLabel: string,
  ): Promise<void> {
    console.log(
      `Check that remove account button is not displayed in account options menu for account ${accountLabel} in account list`,
    );
    await this.openAccountOptionsInAccountList(accountLabel);
    await this.driver.assertElementNotPresent(this.removeAccountButton);
  }
}

export default AccountListPage;
