import { Driver } from '../../webdriver/driver';
import { getCleanAppState } from '../../helpers';
import {
  BASE_ACCOUNT_SYNC_INTERVAL,
  BASE_ACCOUNT_SYNC_TIMEOUT,
} from '../../tests/identity/account-syncing/helpers';
import HomePage from '../pages/home/homepage';
import AccountListPage from '../pages/account-list-page';

/**
 * Waits until the AccountTreeController's `isAccountTreeSyncingInProgress`
 * flag is false.  This is more reliable than
 * `checkHasAccountSyncingSyncedAtLeastOnce` for cases where a second sync is
 * triggered (e.g. when a new non-EVM network is enabled) because that flag is
 * never reset to false once it becomes true.
 *
 * @param driver - The WebDriver instance.
 */
async function waitUntilAccountTreeSyncIdle(driver: Driver): Promise<void> {
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
 * Adds Ethereum HD accounts 2..total via the multichain "Add account" flow.
 * BIP44 Stage 2 (gated by the `bip44Stage2` feature flag and the snap's
 * `tron:728126428` discoverability) automatically derives a matching Tron
 * account at the same index for every HD account that exists, so this
 * function is the only step required before asserting Tron addresses 1..total.
 *
 * Why the name: this helper does NOT call any Tron-specific UI. It piggybacks
 * on the EVM "Add account" flow because that's the only one that grows the
 * HD index, and Tron derivation follows.
 *
 * Waits for the account-tree sync to become idle before each "Add account"
 * action so the button is not stuck in "Syncing..." state.
 *
 * @param driver - The WebDriver instance.
 * @param total - The total number of accounts desired (must be >= 2 to add any).
 */
export async function addNHdAccountsForTronDerivation(
  driver: Driver,
  total: number,
): Promise<void> {
  if (total < 2) {
    return;
  }
  const homepage = new HomePage(driver);
  const accountList = new AccountListPage(driver);
  // Open the multichain accounts page once. Subsequent additions stay on the
  // same page — `addMultichainAccount` does not navigate away — so re-opening
  // the account menu inside the loop would fail because the
  // `account-menu-icon` trigger isn't present on the multichain accounts page.
  await waitUntilAccountTreeSyncIdle(driver);
  await homepage.headerNavbar.openAccountMenu();
  await accountList.checkPageIsLoaded();
  for (let i = 2; i <= total; i += 1) {
    // Wait for any in-progress account-tree sync to finish before interacting.
    // Selecting the Tron network triggers BIP44 Stage 2 which syncs accounts
    // and shows "Syncing…" on the multichain accounts page button.
    await waitUntilAccountTreeSyncIdle(driver);
    await accountList.addMultichainAccount();
    await accountList.checkMultichainAccountNameDisplayed(`Account ${i}`);
  }
  await accountList.closeMultichainAccountsPage();
}
