import messages from '../../../../app/_locales/en/messages.json';
import { ACCOUNT_TYPE } from '../../constants';
import { largeDelayMs, regularDelayMs } from '../../helpers';
import { Driver } from '../../webdriver/driver';

class AccountListPage {
  private readonly driver: Driver;

  private readonly accountListAddressItem =
    '[data-testid="account-list-address"]';

  private readonly accountListBalance =
    '[data-testid="second-currency-display"]';

  private readonly accountValueAndSuffix =
    '[data-testid="account-value-and-suffix"]';

  private readonly accountListItem =
    '.multichain-account-menu-popover__list--menu-item';

  private readonly accountMenuButton =
    '[data-testid="account-list-menu-details"]';

  private readonly accountNameInput = '#account-name';

  private readonly accountOptionsMenuButton =
    '[data-testid="account-list-item-menu-button"]';

  private readonly addAccountConfirmButton =
    '[data-testid="submit-add-account-with-name"]';

  private readonly addBtcAccountButton = {
    text: messages.addNewBitcoinAccount.message,
    tag: 'button',
  };

  private readonly addSolanaAccountButton = {
    text: messages.addNewSolanaAccount.message,
    tag: 'button',
  };

  private readonly addEthereumAccountButton =
    '[data-testid="multichain-account-menu-popover-add-account"]';

  private readonly addEoaAccountButton =
    '[data-testid="multichain-account-menu-popover-add-watch-only-account"]';

  private readonly addHardwareWalletButton = {
    text: 'Add hardware wallet',
    tag: 'button',
  };

  private readonly addImportedAccountButton =
    '[data-testid="multichain-account-menu-popover-add-imported-account"]';

  private readonly addSnapAccountButton = {
    text: 'Add account Snap',
    tag: 'button',
  };

  private readonly closeAccountModalButton =
    'header button[aria-label="Close"]';

  private readonly createAccountButton =
    '[data-testid="multichain-account-menu-popover-action-button"]';

  private readonly currentSelectedAccount =
    '.multichain-account-list-item--selected';

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

  private readonly watchAccountAddressInput =
    'input#address-input[type="text"]';

  private readonly watchAccountConfirmButton = {
    text: 'Watch account',
    tag: 'button',
  };

  private readonly watchAccountModalTitle = {
    text: 'Watch any Ethereum account',
    tag: 'h4',
  };

  private readonly selectAccountSelector =
    '.multichain-account-list-item__account-name';

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
   * Watch an EOA (external owned account).
   *
   * @param address - The address to watch.
   * @param expectedErrorMessage - Optional error message to display if the address is invalid.
   */
  async addEoaAccount(
    address: string,
    expectedErrorMessage: string = '',
  ): Promise<void> {
    console.log(`Watch EOA account with address ${address}`);
    await this.driver.clickElement(this.createAccountButton);
    await this.driver.clickElement(this.addEoaAccountButton);
    await this.driver.waitForSelector(this.watchAccountModalTitle);
    await this.driver.fill(this.watchAccountAddressInput, address);
    await this.driver.clickElementAndWaitToDisappear(
      this.watchAccountConfirmButton,
    );
    if (expectedErrorMessage) {
      console.log(
        `Check if error message is displayed: ${expectedErrorMessage}`,
      );
      await this.driver.waitForSelector({
        css: '.snap-ui-renderer__text',
        text: expectedErrorMessage,
      });
    } else {
      await this.driver.clickElementAndWaitToDisappear(
        this.addAccountConfirmButton,
      );
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
   * Adds a new Solana account with optional custom name.
   *
   * @param options - Options for creating the Solana account
   * @param [options.solanaAccountCreationEnabled] - Whether Solana account creation is enabled. If false, verifies the create button is disabled.
   * @param [options.accountName] - Optional custom name for the new account
   * @returns Promise that resolves when account creation is complete
   */
  async addNewSolanaAccount({
    solanaAccountCreationEnabled = true,
    accountName = '',
  }: {
    solanaAccountCreationEnabled?: boolean;
    accountName?: string;
  } = {}): Promise<void> {
    console.log(
      `Adding new Solana account${
        accountName ? ` with custom name: ${accountName}` : ' with default name'
      }`,
    );
    if (solanaAccountCreationEnabled) {
      await this.driver.clickElement(this.addSolanaAccountButton);
      // needed to mitigate a race condition with the state update
      // there is no condition we can wait for in the UI
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
        this.addSolanaAccountButton,
      );
      assert.equal(await createButton.isEnabled(), false);
      await this.driver.clickElement(this.closeAccountModalButton);
    }
  }

  /**
   * Adds a new account of the specified type with an optional custom name.
   *
   * @param options - Options for adding a new account
   * @param options.accountType - The type of account to add (Ethereum, Bitcoin, or Solana)
   * @param [options.accountName] - Optional custom name for the new account
   * @throws {Error} If the specified account type is not supported
   * @example
   * // Add a new Ethereum account with default name
   * await accountListPage.addAccount({ accountType: ACCOUNT_TYPE.Ethereum });
   *
   * // Add a new Bitcoin account with custom name
   * await accountListPage.addAccount({ accountType: ACCOUNT_TYPE.Bitcoin, accountName: 'My BTC Wallet' });
   */
  async addAccount({
    accountType,
    accountName,
  }: {
    accountType: ACCOUNT_TYPE;
    accountName?: string;
  }) {
    console.log(`Adding new account of type: ${ACCOUNT_TYPE[accountType]}`);
    await this.driver.clickElement(this.createAccountButton);
    let addAccountButton;
    switch (accountType) {
      case ACCOUNT_TYPE.Ethereum:
        addAccountButton = this.addEthereumAccountButton;
        break;
      case ACCOUNT_TYPE.Bitcoin:
        addAccountButton = this.addBtcAccountButton;
        break;
      case ACCOUNT_TYPE.Solana:
        addAccountButton = this.addSolanaAccountButton;
        break;
      default:
        throw new Error('Account type not supported');
    }

    await this.driver.clickElement(addAccountButton);
    if (accountName) {
      console.log(
        `Customize the new account with account name: ${accountName}`,
      );
      await this.driver.fill(this.accountNameInput, accountName);
    }
    // needed to mitigate a race condition with the state update
    // there is no condition we can wait for in the UI
    await this.driver.delay(largeDelayMs);
    await this.driver.clickElementAndWaitToDisappear(
      this.addAccountConfirmButton,
      5000,
    );
  }

  async closeAccountModal(): Promise<void> {
    console.log(`Close account modal in account list`);
    await this.driver.clickElementAndWaitToDisappear(
      this.closeAccountModalButton,
    );
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

  async isBtcAccountCreationButtonEnabled(): Promise<boolean> {
    const createButton = await this.driver.findElement(
      this.addBtcAccountButton,
    );
    return await createButton.isEnabled();
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

  /**
   * Checks that the account value and suffix is displayed in the account list.
   *
   * @param expectedValueAndSuffix - The expected value and suffix to check.
   */
  async check_accountValueAndSuffixDisplayed(
    expectedValueAndSuffix: string,
  ): Promise<void> {
    console.log(
      `Check that account value and suffix ${expectedValueAndSuffix} is displayed in account list`,
    );
    await this.driver.findElement(this.accountValueAndSuffix, 5000);
    await this.driver.waitForSelector(
      {
        css: this.accountValueAndSuffix,
        text: expectedValueAndSuffix,
      },
      {
        timeout: 20000,
      },
    );
  }

  async check_addBitcoinAccountAvailable(
    expectedAvailability: boolean,
  ): Promise<void> {
    console.log(
      `Check add bitcoin account button is ${
        expectedAvailability ? 'displayed ' : 'not displayed'
      }`,
    );
    await this.openAddAccountModal();
    if (expectedAvailability) {
      await this.driver.waitForSelector(this.addBtcAccountButton);
    } else {
      await this.driver.assertElementNotPresent(this.addBtcAccountButton);
    }
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

  async openConnectHardwareWalletModal(): Promise<void> {
    console.log(`Open connect hardware wallet modal`);
    await this.driver.clickElement(this.createAccountButton);
    await this.driver.clickElement(this.addHardwareWalletButton);
    // This delay is needed to mitigate an existing bug in FF
    // See https://github.com/metamask/metamask-extension/issues/25851
    await this.driver.delay(regularDelayMs);
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

  async check_accountAddressDisplayedInAccountList(
    expectedAddress: string,
  ): Promise<void> {
    console.log(
      `Check that account address ${expectedAddress} is displayed in account list`,
    );
    await this.driver.waitForSelector({
      css: this.accountListAddressItem,
      text: expectedAddress,
    });
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

  async check_accountNotDisplayedInAccountList(
    expectedLabel: string = 'Account',
  ): Promise<void> {
    console.log(
      `Check that account label ${expectedLabel} is not displayed in account list`,
    );
    await this.driver.assertElementNotPresent({
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
   * Checks that the add watch account button is displayed in the create account modal.
   *
   * @param expectedAvailability - Whether the add watch account button is expected to be displayed.
   */
  async check_addWatchAccountAvailable(
    expectedAvailability: boolean,
  ): Promise<void> {
    console.log(
      `Check add watch account button is ${
        expectedAvailability ? 'displayed ' : 'not displayed'
      }`,
    );
    await this.openAddAccountModal();
    if (expectedAvailability) {
      await this.driver.waitForSelector(this.addEoaAccountButton);
    } else {
      await this.driver.assertElementNotPresent(this.addEoaAccountButton);
    }
  }

  /**
   * Verifies that all occurrences of the account balance value and symbol are displayed as private.
   *
   */
  async check_balanceIsPrivateEverywhere(): Promise<void> {
    console.log(`Verify all account balance occurrences are private`);
    const balanceSelectors = {
      tag: 'span',
      text: '••••••',
    };
    await this.driver.elementCountBecomesN(balanceSelectors, 6);
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

    await this.driver.waitForSelector(this.accountListItem);
    await this.driver.wait(async () => {
      const internalAccounts = await this.driver.findElements(
        this.accountListItem,
      );
      const isValid = internalAccounts.length === expectedNumberOfAccounts;
      console.log(
        `Number of accounts: ${internalAccounts.length} is equal to ${expectedNumberOfAccounts}? ${isValid}`,
      );
      return isValid;
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

  async selectAccount(accountLabel: string): Promise<void> {
    await this.driver.clickElement({
      css: this.selectAccountSelector,
      text: accountLabel,
    });
  }
}

export default AccountListPage;
