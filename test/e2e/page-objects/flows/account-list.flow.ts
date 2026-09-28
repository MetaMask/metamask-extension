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
 * Asserts that the given account's per-network address row shows the expected
 * address for `networkName`, and that copying the row puts the full address
 * on the clipboard.
 *
 * Assumes the multichain accounts page is already open. Opens the account's
 * menu, enters the address list, asserts, and navigates back to the list.
 *
 * @param options - Flow options.
 * @param options.driver - The WebDriver instance.
 * @param options.accountLabel - Label of the account group to assert.
 * @param options.networkName - Name of the network row inside the address list.
 * @param options.expectedAddress - Full expected address (the row shows the shortened form).
 */
export async function assertAccountNetworkAddress({
  driver,
  accountLabel,
  networkName,
  expectedAddress,
}: {
  driver: Driver;
  accountLabel: string;
  networkName: string;
  expectedAddress: string;
}): Promise<void> {
  const accountListPage = new AccountListPage(driver);
  const accountAddressListPage = new AccountAddressListPage(driver);

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

/**
 * Asserts per-network addresses for a list of accounts, opening the account
 * menu once. Optionally asserts that an account group with
 * `absentAccountLabel` is NOT displayed (e.g. an account beyond a discovery
 * threshold).
 *
 * @param options - Flow options.
 * @param options.driver - The WebDriver instance.
 * @param options.accounts - Accounts to assert, in display order; each item
 * has `accountLabel` (label of the account group) and `expectedAddress` (full
 * expected address for the network, shown shortened in the row).
 * @param options.networkName - Name of the network row inside the address list.
 * @param options.absentAccountLabel - Label of an account group that must not be displayed.
 */
export async function assertAccountNetworkAddresses({
  driver,
  accounts,
  networkName,
  absentAccountLabel,
}: {
  driver: Driver;
  accounts: { accountLabel: string; expectedAddress: string }[];
  networkName: string;
  absentAccountLabel?: string;
}): Promise<void> {
  const homepage = new HomePage(driver);
  const accountListPage = new AccountListPage(driver);

  await homepage.headerNavbar.openAccountMenu();
  await accountListPage.checkPageIsLoaded();
  await accountListPage.waitUntilSyncingIsCompleted();

  for (const account of accounts) {
    await assertAccountNetworkAddress({
      driver,
      networkName,
      ...account,
    });
  }

  if (absentAccountLabel) {
    await accountListPage.checkMultichainAccountNameNotDisplayed(
      absentAccountLabel,
    );
  }

  await accountListPage.closeMultichainAccountsPage();
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
