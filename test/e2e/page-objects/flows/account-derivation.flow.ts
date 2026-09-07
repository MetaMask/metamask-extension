import { Driver } from '../../webdriver/driver';
import HomePage from '../pages/home/homepage';
import AccountListPage from '../pages/accounts/list-page';
import AccountAddressListPage from '../pages/accounts/address-list-page';
import { EXPECTED_TRON_ADDRESSES_BY_INDEX } from '../../constants';
import { shortenAddress } from '../../../../ui/helpers/utils/util';

/**
 * Asserts the derived Tron address for the account at `index` (0-based):
 * opens the account's multichain menu, enters the address list, verifies the
 * shortened address is shown for the Tron row, and copies it to the clipboard.
 * @param driver
 * @param index
 */
export async function assertTronAddressAtIndex(
  driver: Driver,
  index: number,
): Promise<void> {
  const accountList = new AccountListPage(driver);
  const addressList = new AccountAddressListPage(driver);
  const accountLabel = `Account ${index + 1}`;
  const expected = EXPECTED_TRON_ADDRESSES_BY_INDEX[index];

  await accountList.openMultichainAccountMenu({ accountLabel });
  await accountList.clickMultichainAccountMenuItem('Addresses');
  await addressList.checkPageIsLoaded();
  await addressList.checkNetworkAddressIsDisplayedForNetwork({
    networkName: 'Tron',
    networkAddress: shortenAddress(expected),
  });
  await addressList.clickCopyButtonForNetworkAndAssertClipboard({
    networkName: 'Tron',
    expectedAddress: expected,
  });
  await addressList.goBack();
}

/**
 * Asserts the derived Tron addresses for the first `total` HD accounts and
 * optionally that an account with `absentAccountLabel` is not displayed.
 * @param driver
 * @param total
 * @param options
 * @param options.absentAccountLabel - Label of an account group that must
 * NOT be displayed (e.g. an account beyond the discovery threshold).
 */
export async function assertTronAddressesForAccounts(
  driver: Driver,
  total: number,
  options: { absentAccountLabel?: string } = {},
): Promise<void> {
  const homepage = new HomePage(driver);
  const accountList = new AccountListPage(driver);

  await homepage.headerNavbar.openAccountMenu();
  await accountList.checkPageIsLoaded();
  await accountList.waitUntilSyncingIsCompleted();

  for (let index = 0; index < total; index += 1) {
    await assertTronAddressAtIndex(driver, index);
  }

  if (options.absentAccountLabel) {
    await accountList.checkMultichainAccountNameNotDisplayed(
      options.absentAccountLabel,
    );
  }

  await accountList.closeMultichainAccountsPage();
}
