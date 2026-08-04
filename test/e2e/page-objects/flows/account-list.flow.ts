import { Driver } from '../../webdriver/driver';
import {
  KNOWN_PUBLIC_KEY_ADDRESSES,
  KNOWN_QR_ACCOUNTS,
} from '../../../stub/keyring-bridge';
import AccountListPage from '../pages/account-list-page';
import AddressListModal from '../pages/multichain/address-list-modal';
import HeaderNavbar from '../pages/header-navbar';
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
  const addressListModal = new AddressListModal(driver);
  for (let index = 0; index < count; index++) {
    const accountName = `${type} Account ${index + 1}`;
    await accountListPage.checkAccountDisplayedInAccountList(accountName);
    await accountListPage.openMultichainAccountMenu({
      accountLabel: accountName,
    });
    await accountListPage.checkMultiChainAccountMenuIsDisplayed();
    await accountListPage.clickMultichainAccountMenuItem('Addresses');
    await addressListModal.checkNetworkAddressIsDisplayed(
      shortenAddress(addresses[index].address),
    );
    await addressListModal.goBack();
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
