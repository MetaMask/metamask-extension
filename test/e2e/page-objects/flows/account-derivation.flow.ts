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
 * Adds HD account groups 2 through `total` using the multichain account UI.
 *
 * @param driver - The WebDriver instance.
 * @param total - The total number of account groups desired.
 */
export async function addNHdAccountsForDerivation(
  driver: Driver,
  total: number,
): Promise<void> {
  if (total < 2) {
    return;
  }

  const homepage = new HomePage(driver);
  const accountList = new AccountListPage(driver);

  await waitUntilAccountTreeSyncIdle(driver);
  await homepage.headerNavbar.openAccountMenu();
  await accountList.checkPageIsLoaded();

  for (let index = 2; index <= total; index += 1) {
    await waitUntilAccountTreeSyncIdle(driver);
    await accountList.addMultichainAccount();
    await accountList.checkMultichainAccountNameDisplayed(`Account ${index}`);
  }

  await accountList.closeMultichainAccountsPage();
}
