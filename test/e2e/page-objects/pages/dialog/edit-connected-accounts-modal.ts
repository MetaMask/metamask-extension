import { Driver } from '../../../webdriver/driver';

class EditConnectedAccountsModal {
  driver: Driver;

  private readonly accountCheckbox = 'input[type="checkbox"]';

  private readonly addNewAccountButton = {
    testId: 'add-new-account-button',
  };

  private readonly disconnectButton = {
    testId: 'disconnect-accounts-button',
  };

  private readonly editAccountsModalTitle = {
    text: 'Edit accounts',
    tag: 'h4',
  };

  private readonly ethereumAccountButton = {
    text: 'Ethereum account',
    tag: 'button',
  };

  private readonly selectAllAccountsCheckbox = 'input[title="Select all"]';

  private readonly submitAddAccountButton = {
    testId: 'submit-add-account-with-name',
  };

  private readonly updateAccountsButton = {
    testId: 'connect-more-accounts-button',
  };

  constructor(driver: Driver) {
    this.driver = driver;
  }

  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  async check_pageIsLoaded(): Promise<void> {
    try {
      await this.driver.waitForMultipleSelectors([
        this.editAccountsModalTitle,
        this.updateAccountsButton,
      ]);
    } catch (e) {
      console.log(
        'Timeout while waiting for edit connected accounts modal to be loaded',
        e,
      );
      throw e;
    }
    console.log('Edit connected accounts modal is loaded');
  }

  async addNewEthereumAccount(): Promise<void> {
    console.log('Add new Ethereum account');
    await this.driver.clickElement(this.addNewAccountButton);
    await this.driver.clickElement(this.ethereumAccountButton);
    await this.driver.clickElement(this.submitAddAccountButton);
  }

  async disconnectAccount(): Promise<void> {
    console.log('Disconnect account on edit connected accounts modal');
    await this.driver.clickElementAndWaitToDisappear(this.disconnectButton);
  }

  async selectAllAccounts(): Promise<void> {
    console.log('Select all accounts on edit connected accounts modal');
    await this.driver.clickElement(this.selectAllAccountsCheckbox);
    await this.driver.clickElementAndWaitToDisappear(this.updateAccountsButton);
  }

  /**
   * Selects an account at the specified index
   *
   * @param accountIndex - The index of the account to select (1-based)
   */
  async selectAccount(accountIndex: number): Promise<void> {
    console.log(
      `Select account number ${accountIndex} on edit connected accounts modal`,
    );
    const checkboxes = await this.driver.findElements(this.accountCheckbox);
    const accountCheckbox = checkboxes[accountIndex];
    await accountCheckbox.click();
  }

  /**
   * Checks if an account at the specified index is selected
   *
   * @param accountIndex - The index of the account to check (1-based)
   * @returns boolean indicating if the account is selected
   */
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  async check_isAccountSelected(accountIndex: number): Promise<boolean> {
    console.log(`Checking if account number ${accountIndex} is selected`);
    const checkboxes = await this.driver.findElements(this.accountCheckbox);
    const accountCheckbox = checkboxes[accountIndex];
    return await accountCheckbox.isSelected();
  }
}

export default EditConnectedAccountsModal;
