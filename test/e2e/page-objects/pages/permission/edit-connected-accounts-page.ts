import { Driver } from '../../../webdriver/driver';

/**
 * Edit connected accounts view for a site's account permissions.
 *
 * Screen: the shared edit-accounts surface
 * (`multichain-edit-accounts-page.tsx`). It renders in two hosts: the connect
 * confirmation dialog, opened via the accounts "Edit" control on
 * `ConnectAccountConfirmation` (footer button reads "Connect"/"Update"), and
 * the wallet's per-site `#/review-permissions` page, which opens directly
 * into this view (footer button reads "Save", plus a disconnect action in
 * the header).
 * Owns: account cells and checkboxes, selection assertions, add-account
 * control, the connect/save footer button, and the disconnect flow.
 * Boundaries: opening the view belongs to the connect flows or
 * `PermissionListPage`. Disconnect methods only apply on the
 * review-permissions host.
 * Related: `ConnectAccountConfirmation`, `PermissionListPage`,
 * `flows/connect.flow.ts`, `flows/permissions.flow.ts`.
 *
 * @see ui/components/multichain-accounts/permissions/multichain-edit-accounts-page/multichain-edit-accounts-page.tsx
 * @see ui/components/multichain-accounts/permissions/permission-review-page/multichain-review-permissions-page.tsx
 */
class EditConnectedAccountsPage {
  private readonly accountCell = '.multichain-account-cell';

  private readonly accountCheckbox = 'input[type="checkbox"]';

  private readonly accountName = (accountLabel: string) => ({
    testId: `multichain-account-cell-name-${accountLabel}`,
  });

  private readonly addNewAccountButton = {
    testId: 'add-multichain-account-button',
  };

  private readonly addNewAccountButtonReadyState = {
    testId: 'add-multichain-account-button',
    text: 'Add account',
  };

  private readonly anyAccountName =
    '[data-testid^="multichain-account-cell-name-"]';

  private readonly confirmDisconnectButton = '[data-testid="disconnect-all"]';

  // Reads "Connect"/"Update" in the connect dialog and "Save" on the
  // review-permissions page.
  private readonly connectAccountsButton = {
    testId: 'connect-more-accounts-button',
  };

  private readonly disconnectButton = '[data-testid="disconnect-button"]';

  private readonly disconnectModal = '[data-testid="disconnect-all-modal"]';

  private readonly driver: Driver;

  private readonly editAccountsPageHeader = {
    testId: 'edit-accounts-modal-header',
  };

  private readonly permissionListPage =
    '[data-testid="parent-selector-permission-list"]';

  constructor(driver: Driver) {
    this.driver = driver;
  }

  async addNewAccount(): Promise<void> {
    console.log('Add new account');
    const initialCheckboxes = await this.driver.findElements(
      this.accountCheckbox,
    );
    const initialCheckboxCount = initialCheckboxes.length;

    await this.driver.waitForSelector(this.addNewAccountButtonReadyState, {
      timeout: 10000,
    });
    await this.driver.clickElement(this.addNewAccountButton);
    await this.driver.waitUntil(
      async () => {
        try {
          const checkboxes = await this.driver.findElements(
            this.accountCheckbox,
          );
          return checkboxes.length > initialCheckboxCount;
        } catch {
          return false;
        }
      },
      { interval: 500, timeout: 10000 },
    );
    // The new account is appended as the last row, so select it by index
    // rather than assuming a specific label; this keeps repeated calls (e.g.
    // approveConnect with totalAccounts > 2) selecting the right account.
    await this.selectAccount(initialCheckboxCount + 1);
    await this.clickOnConnect();
  }

  /**
   * Check that the account row for the given label is selected (checked).
   *
   * Account rows and their checkboxes render in the same order, so the
   * checkbox at the row's index reflects the row's selection state.
   *
   * @param accountLabel - Account label to check
   */
  async checkAccountIsSelected(accountLabel: string): Promise<void> {
    console.log(`Check that account ${accountLabel} is selected`);
    await this.driver.waitForSelector(this.accountName(accountLabel));
    await this.driver.waitUntil(
      async () => {
        const accountNames = await this.driver.findElements(
          this.anyAccountName,
        );
        const checkboxes = await this.driver.findElements(this.accountCheckbox);
        for (let i = 0; i < accountNames.length; i++) {
          const testId = await accountNames[i].getAttribute('data-testid');
          if (testId === `multichain-account-cell-name-${accountLabel}`) {
            return checkboxes.length > i && (await checkboxes[i].isSelected());
          }
        }
        return false;
      },
      { interval: 500, timeout: 10000 },
    );
  }

  /**
   * Check that all given account labels are selected (checked).
   *
   * @param accountLabels - Account labels to check
   */
  async checkAccountsAreSelected(accountLabels: string[]): Promise<void> {
    for (const accountLabel of accountLabels) {
      await this.checkAccountIsSelected(accountLabel);
    }
  }

  /**
   * Check the edit connected accounts view is loaded.
   *
   * @param site - When given, also assert the connected-site host is shown.
   */
  async checkPageIsLoaded(site?: string): Promise<void> {
    try {
      await this.driver.waitForSelector(this.editAccountsPageHeader);
      await this.driver.waitForSelector(this.connectAccountsButton);
      if (site) {
        await this.driver.waitForSelector({ text: site, tag: 'span' });
      }
    } catch (e) {
      console.log(
        'Timeout while waiting for edit connected accounts view to be loaded',
        e,
      );
      throw e;
    }
    console.log('Edit connected accounts view is loaded');
  }

  /**
   * Check that the expected number of accounts are selected (checked).
   *
   * @param expectedNumber - Expected number of selected accounts
   */
  async checkSelectedAccountsNumber(expectedNumber: number): Promise<void> {
    console.log(
      `Check that the number of selected accounts is: ${expectedNumber}`,
    );
    await this.driver.waitUntil(
      async () => {
        const checkboxes = await this.driver.findElements(this.accountCheckbox);
        const selectedStates = await Promise.all(
          checkboxes.map((checkbox) => checkbox.isSelected()),
        );
        return selectedStates.filter(Boolean).length === expectedNumber;
      },
      { interval: 500, timeout: 10000 },
    );
  }

  async clickOnConnect(): Promise<void> {
    console.log('Click on Connect');
    await this.driver.clickElement(this.connectAccountsButton);
  }

  /**
   * Disconnect the site (review-permissions host only): click the header
   * disconnect action and confirm in the disconnect modal. Lands back on the
   * permissions list. The list's empty state is not asserted here because
   * permitted snap subjects keep the connection count non-zero without
   * rendering a row.
   */
  async disconnectAll(): Promise<void> {
    console.log('Disconnect all permissions for the site');
    await this.driver.clickElement(this.disconnectButton);
    await this.driver.waitForSelector(this.disconnectModal);
    await this.driver.clickElementAndWaitToDisappear(
      this.confirmDisconnectButton,
    );
    await this.driver.waitForSelector(this.permissionListPage);
  }

  /**
   * Toggle the given account rows and save the new selection
   * (review-permissions host).
   *
   * @param accountLabels - Account labels to toggle
   */
  async editPermissionsForAccount(accountLabels: string[]): Promise<void> {
    console.log(`Edit permissions for accounts: ${accountLabels.join(', ')}`);
    for (const accountLabel of accountLabels) {
      await this.driver.clickElement(this.accountName(accountLabel));
    }
    await this.driver.clickElementAndWaitToDisappear(
      this.connectAccountsButton,
    );
  }

  /**
   * Toggles an account at the specified index.
   *
   * @param accountIndex - The index of the account to toggle (1-based)
   */
  async selectAccount(accountIndex: number): Promise<void> {
    const checkboxes = await this.driver.findElements(this.accountCheckbox);
    const accountCells = await this.driver.findElements(this.accountCell);

    if (
      accountCells.length < accountIndex ||
      checkboxes.length < accountIndex
    ) {
      throw new Error(
        `Unable to select account ${accountIndex}: found ${accountCells.length} account rows and ${checkboxes.length} checkboxes`,
      );
    }

    const accountCheckbox = checkboxes[accountIndex - 1];
    const isSelected = await accountCheckbox.isSelected();

    await accountCells[accountIndex - 1].click();
    await this.waitForAccountSelectedStatus({
      accountIndex,
      status: isSelected ? 'unselected' : 'selected',
    });
  }

  /**
   * Waits until the account checkbox at the given index reaches the expected
   * selected state.
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

  /**
   * Waits until the Connect button reaches the expected state.
   *
   * @param options - The options object.
   * @param options.state - Whether the button should be 'enabled' or 'disabled'.
   */
  async waitForConnectButtonState({
    state,
  }: {
    state: 'enabled' | 'disabled';
  }): Promise<void> {
    console.log(`Waiting for Connect button to be ${state}`);
    await this.driver.waitForSelector(this.connectAccountsButton, {
      state,
    });
  }
}

export default EditConnectedAccountsPage;
