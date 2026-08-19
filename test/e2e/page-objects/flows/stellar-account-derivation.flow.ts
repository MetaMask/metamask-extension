import { Driver } from '../../webdriver/driver';
import HomePage from '../pages/home/homepage';
import AccountListPage from '../pages/account-list-page';
import { waitUntilAccountTreeSyncIdle } from './tron-account-derivation.flow';

export { waitUntilAccountTreeSyncIdle };

/**
 * Adds Ethereum HD accounts 2..total via the multichain "Add account" flow.
 * BIP44 Stage 2 (with `stellarAccounts` enabled) automatically derives a
 * matching Stellar account at the same index for every HD account that exists.
 *
 * This helper does not call any Stellar-specific UI — growing the HD index via
 * "Add account" is enough for Stellar derivation to follow.
 *
 * @param driver - The WebDriver instance.
 * @param total - The total number of accounts desired (must be >= 2 to add any).
 */
export async function addNHdAccountsForStellarDerivation(
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
  for (let i = 2; i <= total; i += 1) {
    await waitUntilAccountTreeSyncIdle(driver);
    await accountList.addMultichainAccount();
    await accountList.checkMultichainAccountNameDisplayed(`Account ${i}`);
  }
  await accountList.closeMultichainAccountsPage();
}
