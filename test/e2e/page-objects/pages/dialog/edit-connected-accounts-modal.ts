import { Driver } from '../../../webdriver/driver';

class EditConnectedAccountsModal {
  driver: Driver;

  private readonly accountCheckbox = 'input[type="checkbox"]';

  private readonly addNewAccountButton = {
    testId: 'add-multichain-account-button',
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

  private readonly connectAccountsButton = {
    testId: 'connect-more-accounts-button',
  };

  private readonly newlyCreateAccount = {
    css: 'p',
    text: 'Account 2',
  };

  constructor(driver: Driver) {
    this.driver = driver;
  }

  async checkPageIsLoaded(): Promise<void> {
    try {
      await this.driver.waitForMultipleSelectors([
        this.editAccountsModalTitle,
        this.connectAccountsButton,
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

  async addNewAccount(): Promise<void> {
    console.log('Add  account');
    await this.driver.clickElement(this.addNewAccountButton);
    await this.driver.waitForSelector(this.newlyCreateAccount);
    await this.driver.clickElement(this.newlyCreateAccount);
    await this.clickOnConnect();
  }

  async clickOnConnect(): Promise<void> {
    console.log('Click on Connect');
    await this.driver.clickElement(this.connectAccountsButton);
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
    const accountCheckbox = checkboxes[accountIndex - 1];
    await accountCheckbox.click();
  }

  /**
   * Waits until the account checkbox at the given index reaches the expected selected state.
   *
   * @param options - The options object.
   * @param options.accountIndex - The 1-based index of the account to check.
   * @param options.status - Whether the checkbox should be 'selected' or 'unselected'.
   */
  async waitForAccountSelectedStatus({
    accountIndex,
    status,
  }: {
    accountIndex: number;
    status: 'selected' | 'unselected';
  }): Promise<void> {
    console.log(`Waiting for account ${accountIndex} to be ${status}`);
    await this.driver.waitUntil(
      async () => {
        const checkboxes = await this.driver.findElements(this.accountCheckbox);

        if (checkboxes.length < accountIndex) {
          return false;
        }

        const isSelected = await checkboxes[accountIndex - 1].isSelected();
        return status === 'selected' ? isSelected : !isSelected;
      },
      { interval: 500, timeout: 5000 },
    );
  }
}

export default EditConnectedAccountsModal;
