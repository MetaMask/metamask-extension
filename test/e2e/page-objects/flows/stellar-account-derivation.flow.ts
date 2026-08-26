import { EXPECTED_STELLAR_ADDRESSES_BY_INDEX } from '../../constants';
import { Driver } from '../../webdriver/driver';
import { shortenAddress } from '../../../../ui/helpers/utils/util';
import HomePage from '../pages/home/homepage';
import AccountListPage from '../pages/accounts/list-page';
import AccountAddressListPage from '../pages/accounts/address-list-page';
import { waitUntilAccountTreeSyncIdle } from './tron-account-derivation.flow';

export { waitUntilAccountTreeSyncIdle };

const STELLAR_NETWORK_NAME = 'Stellar';

/**
 * Opens Addresses for Accounts 1..total and asserts each Stellar address
 * matches {@link EXPECTED_STELLAR_ADDRESSES_BY_INDEX} (row + clipboard).
 *
 * @param driver - WebDriver instance
 * @param total - Number of HD accounts to assert (1-based count)
 * @param options - Optional absent-account assertion after the address loop
 * @param options.absentAccountLabel - Label that must not appear (e.g. Account 6)
 */
export async function assertStellarAddressesForAccounts(
  driver: Driver,
  total: number,
  options: { absentAccountLabel?: string } = {},
): Promise<void> {
  const homepage = new HomePage(driver);
  const accountList = new AccountListPage(driver);
  const addressList = new AccountAddressListPage(driver);

  await homepage.headerNavbar.openAccountMenu();
  await accountList.checkPageIsLoaded();
  await accountList.waitUntilSyncingIsCompleted();

  for (let index = 0; index < total; index += 1) {
    const accountLabel = `Account ${index + 1}`;
    const expected = EXPECTED_STELLAR_ADDRESSES_BY_INDEX[index];

    await accountList.openMultichainAccountMenu({ accountLabel });
    await accountList.clickMultichainAccountMenuItem('Addresses');
    await addressList.checkPageIsLoaded();
    await addressList.checkNetworkAddressIsDisplayedForNetwork({
      networkName: STELLAR_NETWORK_NAME,
      networkAddress: shortenAddress(expected),
    });
    await addressList.clickCopyButtonForNetworkAndAssertClipboard({
      networkName: STELLAR_NETWORK_NAME,
      expectedAddress: expected,
    });
    await addressList.goBack();
  }

  if (options.absentAccountLabel) {
    await accountList.checkMultichainAccountNameNotDisplayed(
      options.absentAccountLabel,
    );
  }

  await accountList.closeMultichainAccountsPage();
}

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
