import { Driver } from '../../webdriver/driver';
import {
  KNOWN_PUBLIC_KEY_ADDRESSES,
  KNOWN_QR_ACCOUNTS,
} from '../../../stub/keyring-bridge';
import AccountListPage from '../pages/accounts/list-page';
import AccountAddressListPage from '../pages/accounts/address-list-page';
import HeaderNavbar from '../pages/home/header-navbar';
import HomePage from '../pages/home/homepage';
import { shortenAddress } from '../../../../ui/helpers/utils/util';

/**
 * Asserts that the specified account is visible in the account list.
 *
 * @param driver - The WebDriver instance.
 * @param accountName - The name of the account to check.
 */
export const assertAccountVisible = async (
  driver: Driver,
  accountName: string,
): Promise<void> => {
  const headerNavbar = new HeaderNavbar(driver);
  const accountListPage = new AccountListPage(driver);
  await headerNavbar.checkPageIsLoaded();
  await headerNavbar.openAccountMenu();
  await accountListPage.checkAccountDisplayedInAccountList(accountName);
  await accountListPage.closeMultichainAccountsPage();
};

export async function checkAccountAddressDisplayedInAccountList(
  driver: Driver,
  type: string,
  count: number,
): Promise<void> {
  const addresses =
    type === 'QR' ? KNOWN_QR_ACCOUNTS : KNOWN_PUBLIC_KEY_ADDRESSES;
  const accountListPage = new AccountListPage(driver);
  await accountListPage.checkPageIsLoaded();
  const accountAddressListPage = new AccountAddressListPage(driver);
  for (let index = 0; index < count; index++) {
    const accountName = `${type} Account ${index + 1}`;
    await accountListPage.checkAccountDisplayedInAccountList(accountName);
    await accountListPage.openMultichainAccountMenu({
      accountLabel: accountName,
    });
    await accountListPage.checkMultiChainAccountMenuIsDisplayed();
    await accountListPage.clickMultichainAccountMenuItem('Addresses');
    await accountAddressListPage.checkNetworkAddressIsDisplayed(
      shortenAddress(addresses[index].address),
    );
    await accountAddressListPage.goBack();
  }
}

/**
 * Switches to the specified account via the homepage account menu.
 *
 * @param driver
 * @param accountName
 */
export const switchToAccount = async (
  driver: Driver,
  accountName: string,
): Promise<void> => {
  const homePage = new HomePage(driver);
  await homePage.checkPageIsLoaded();
  await homePage.headerNavbar.openAccountMenu();

  const accountListPage = new AccountListPage(driver);
  await accountListPage.checkPageIsLoaded();
  await accountListPage.checkAccountDisplayedInAccountList(accountName);
  await accountListPage.switchToAccount(accountName);
  await homePage.headerNavbar.checkAccountLabel(accountName);
};

type AssertAddressAtIndexOptions = {
  index: number;
  networkName: string;
  expectedAddress: string;
};

/**
 * Asserts the derived address for the account at `index` (0-based) on the
 * given network: opens the account's multichain menu, enters the address list,
 * verifies the shortened address is shown for the network row, and copies it
 * to the clipboard.
 *
 * @param driver - The WebDriver instance.
 * @param options - Assertion options.
 * @param options.index - Zero-based account index.
 * @param options.networkName - Network row to assert.
 * @param options.expectedAddress - Full address expected for the account.
 */
export async function assertAddressAtIndex(
  driver: Driver,
  { index, networkName, expectedAddress }: AssertAddressAtIndexOptions,
): Promise<void> {
  const accountListPage = new AccountListPage(driver);
  const accountAddressListPage = new AccountAddressListPage(driver);
  const accountLabel = `Account ${index + 1}`;

  await accountListPage.openMultichainAccountMenu({ accountLabel });
  await accountListPage.clickMultichainAccountMenuItem('Addresses');
  await accountAddressListPage.checkPageIsLoaded();
  await accountAddressListPage.checkNetworkAddressIsDisplayedForNetwork({
    networkName,
    networkAddress: shortenAddress(expectedAddress),
  });
  await accountAddressListPage.clickCopyButtonForNetworkAndAssertClipboard({
    networkName,
    expectedAddress,
  });
  await accountAddressListPage.goBack();
}

type AssertNetworkAddressesForAccountsOptions = {
  total: number;
  networkName: string;
  expectedAddresses: readonly string[];
};

/**
 * Asserts the derived addresses for the first `total` HD accounts.
 *
 * @param driver - The WebDriver instance.
 * @param options - Assertion options.
 * @param options.total - Number of accounts to assert, starting at index 0.
 * @param options.networkName - Network row to assert.
 * @param options.expectedAddresses - Expected addresses by account index.
 */
export async function assertNetworkAddressesForAccounts(
  driver: Driver,
  {
    total,
    networkName,
    expectedAddresses,
  }: AssertNetworkAddressesForAccountsOptions,
): Promise<void> {
  const homePage = new HomePage(driver);
  const accountListPage = new AccountListPage(driver);

  await homePage.headerNavbar.openAccountMenu();
  await accountListPage.checkPageIsLoaded();
  await accountListPage.waitUntilSyncingIsCompleted();

  for (let index = 0; index < total; index += 1) {
    await assertAddressAtIndex(driver, {
      index,
      networkName,
      expectedAddress: expectedAddresses[index],
    });
  }

  await accountListPage.closeMultichainAccountsPage();
}
