import { Driver } from '../../webdriver/driver';
import { getCleanAppState } from '../../helpers';
import {
  BASE_ACCOUNT_SYNC_INTERVAL,
  BASE_ACCOUNT_SYNC_TIMEOUT,
} from '../../tests/identity/account-syncing/helpers';
import HomePage from '../pages/home/homepage';
import AccountListPage from '../pages/accounts/list-page';

/**
 * Waits until the AccountTreeController has finished synchronizing.
 *
 * @param driver - The WebDriver instance.
 */
export async function waitUntilAccountTreeSyncIdle(
  driver: Driver,
): Promise<void> {
  await driver.waitUntil(
    async () => {
      const uiState = await getCleanAppState(driver);
      return uiState?.metamask?.isAccountTreeSyncingInProgress === false;
    },
    {
      interval: BASE_ACCOUNT_SYNC_INTERVAL,
      timeout: BASE_ACCOUNT_SYNC_TIMEOUT,
    },
  );
}

/**
 * Opens the account menu, adds a new multichain account, verifies it is
 * displayed, and either switches to the specified account or closes the page.
 *
 * @param options - Flow options.
 * @param options.driver - The webdriver instance.
 * @param options.createdAccountLabel - Expected label of the newly created account. Defaults to 'Account 2'.
 * @param options.switchToAccount - Account label to switch to after creation.
 * @param options.expectedBalance - Balance expected on the homepage before opening the account menu. Defaults to '25'.
 */
export const addAccount = async ({
  driver,
  createdAccountLabel = 'Account 2',
  switchToAccount,
  expectedBalance = '25',
}: {
  driver: Driver;
  createdAccountLabel?: string;
  switchToAccount?: string;
  expectedBalance?: string;
}): Promise<void> => {
  const homepage = new HomePage(driver);
  await homepage.checkExpectedBalanceIsDisplayed(expectedBalance);
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
 * @param options.accountToSelect - Account label to select once creation is done. Pass `null` to close the account list without selecting. Defaults to 'Account 1'.
 * @param options.waitForAccountTreeSync - Wait for the account tree sync to be idle before opening the menu and before each account creation. Defaults to false.
 */
export const addMultipleAccounts = async ({
  driver,
  numberOfAccounts = 1,
  accountToSelect = 'Account 1',
  waitForAccountTreeSync = false,
}: {
  driver: Driver;
  numberOfAccounts?: number;
  accountToSelect?: string | null;
  waitForAccountTreeSync?: boolean;
}): Promise<void> => {
  const homepage = new HomePage(driver);
  const accountListPage = new AccountListPage(driver);

  await homepage.checkPageIsLoaded();

  if (waitForAccountTreeSync) {
    await waitUntilAccountTreeSyncIdle(driver);
  }

  await homepage.headerNavbar.openAccountMenu();

  for (let i = 0; i < numberOfAccounts; i++) {
    if (waitForAccountTreeSync && i > 0) {
      await waitUntilAccountTreeSyncIdle(driver);
    }

    await accountListPage.checkPageIsLoaded();
    await accountListPage.addMultichainAccount();
    await accountListPage.checkMultichainAccountNameDisplayed(
      `Account ${i + 2}`,
    );
  }

  if (accountToSelect === null) {
    await accountListPage.closeMultichainAccountsPage();
  } else {
    await accountListPage.selectAccount(accountToSelect);
  }
};

/**
 * Opens the account menu and imports an account from a private key.
 * After a successful import, the wallet is on home with the imported account selected.
 *
 * @param driver - The WebDriver instance.
 * @param privateKey - The private key to import.
 * @param options - Optional flow configuration.
 * @param options.accountListTimeout - Timeout while waiting for the account list
 * (including account syncing) to be ready.
 */
export async function importPrivateKeyAccount(
  driver: Driver,
  privateKey: string,
  options: { accountListTimeout?: number } = {},
): Promise<void> {
  const homepage = new HomePage(driver);
  await homepage.headerNavbar.openAccountMenu();

  const accountListPage = new AccountListPage(driver);
  await accountListPage.checkPageIsLoaded(options.accountListTimeout);
  await accountListPage.addNewImportedAccount(privateKey);
  await homepage.checkPageIsLoaded();
  await homepage.dismissAccountImportedToast();
}
