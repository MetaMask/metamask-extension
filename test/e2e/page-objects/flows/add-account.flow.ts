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
 * Creates one or more multichain accounts through the account menu.
 *
 * Owns the invariant part of the flow: ensuring the homepage is ready,
 * opening the account menu, clicking "Add account" for each account, and
 * closing the account list page afterwards. Everything that varies between
 * tests is expressed as hooks:
 *
 * @param options - Flow options.
 * @param options.driver - The webdriver instance.
 * @param options.count - Number of accounts to create.
 * @param options.onBeforeAdd - Hook that runs before each add (e.g. sync waits).
 * @param options.onAfterAdd - Hook that runs after each add; receives the label the UI assigned to the account (e.g. 'Account 2').
 * @param options.onDone - Hook that replaces the default ending (closing the account list page).
 */
export async function addAccounts({
  driver,
  count,
  onBeforeAdd,
  onAfterAdd,
  onDone,
}: {
  driver: Driver;
  count: number;
  onBeforeAdd?: ({
    driver,
    index,
  }: {
    driver: Driver;
    index: number;
  }) => Promise<void>;
  onAfterAdd?: ({
    driver,
    label,
    index,
  }: {
    driver: Driver;
    label: string;
    index: number;
  }) => Promise<void>;
  onDone?: ({
    driver,
    accountList,
  }: {
    driver: Driver;
    accountList: AccountListPage;
  }) => Promise<void>;
}): Promise<void> {
  const homepage = new HomePage(driver);
  const accountListPage = new AccountListPage(driver);

  await homepage.checkPageIsLoaded();
  await homepage.headerNavbar.openAccountMenu();

  for (let index = 0; index < count; index++) {
    await onBeforeAdd?.({ driver, index });

    await accountListPage.checkPageIsLoaded();
    await accountListPage.addMultichainAccount();
    await onAfterAdd?.({ driver, label: `Account ${index + 2}`, index });
  }

  if (onDone) {
    await onDone({ driver, accountList: accountListPage });
  } else {
    await accountListPage.closeMultichainAccountsPage();
  }
}

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
