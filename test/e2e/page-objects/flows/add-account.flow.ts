import { Driver } from '../../webdriver/driver';
import HomePage from '../pages/home/homepage';
import AccountListPage from '../pages/account-list-page';

/**
 * Opens the account menu, adds a new multichain account, verifies it is
 * displayed, and either switches to the specified account or closes the page.
 *
 * @param options - Flow options.
 * @param options.driver - The webdriver instance.
 * @param options.createdAccountLabel - Expected label of the newly created account. Defaults to 'Account 2'.
 * @param options.switchToAccount - Account label to switch to after creation.
 */
export const addAccount = async ({
  driver,
  createdAccountLabel = 'Account 2',
  switchToAccount,
}: {
  driver: Driver;
  createdAccountLabel?: string;
  switchToAccount?: string;
}): Promise<void> => {
  const homepage = new HomePage(driver);
  await homepage.checkExpectedBalanceIsDisplayed();
  await homepage.headerNavbar.openAccountMenu();

  const accountListPage = new AccountListPage(driver);
  await accountListPage.checkPageIsLoaded();
  await accountListPage.addMultichainAccount();
  await accountListPage.checkAccountDisplayedInAccountList(createdAccountLabel);

  if (switchToAccount) {
    await accountListPage.selectAccount(switchToAccount);
  } else {
    await accountListPage.closeMultichainAccountsPage();
  }
};

/**
 * Opens the account menu once, creates the given number of accounts while
 * keeping the account list open, then selects the requested account.
 *
 * Use this flow when a test needs to create multiple accounts in one account
 * list session. For single-account creation with label verification, use
 * `addAccount`.
 *
 * @param options - Flow options.
 * @param options.driver - The webdriver instance.
 * @param options.numberOfAccounts - Number of accounts to create. Defaults to 1.
 * @param options.accountToSelect - Account label to select once creation is done. Defaults to 'Account 1'.
 */
export const addMultipleAccounts = async ({
  driver,
  numberOfAccounts = 1,
  accountToSelect = 'Account 1',
}: {
  driver: Driver;
  numberOfAccounts?: number;
  accountToSelect?: string;
}): Promise<void> => {
  const homepage = new HomePage(driver);
  const accountListPage = new AccountListPage(driver);

  await homepage.checkExpectedBalanceIsDisplayed();

  for (let i = 0; i < numberOfAccounts; i++) {
    if (i === 0) {
      await homepage.headerNavbar.openAccountMenu();
    }

    await accountListPage.checkPageIsLoaded();
    await accountListPage.addMultichainAccount();
  }

  await accountListPage.selectAccount(accountToSelect);
};

/**
 * Opens the account menu and imports an account from a private key.
 *
 * @param driver - The WebDriver instance.
 * @param privateKey - The private key to import.
 * @param options - Optional flow configuration.
 * @param options.accountListTimeout - When set, waits for account syncing to
 * finish (with this timeout in ms) before importing.
 */
export async function importPrivateKeyAccount(
  driver: Driver,
  privateKey: string,
  options: { accountListTimeout?: number } = {},
): Promise<void> {
  const homepage = new HomePage(driver);
  await homepage.headerNavbar.openAccountMenu();

  const accountListPage = new AccountListPage(driver);
  await accountListPage.checkPageIsLoaded();
  if (options.accountListTimeout !== undefined) {
    await accountListPage.waitUntilSyncingIsCompleted(
      options.accountListTimeout,
    );
  }
  await accountListPage.addNewImportedAccount(privateKey);
  await accountListPage.closeMultichainAccountsPage();
}
