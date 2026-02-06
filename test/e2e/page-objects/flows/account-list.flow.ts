import { Driver } from '../../webdriver/driver';
import {
  KNOWN_PUBLIC_KEY_ADDRESSES,
  KNOWN_QR_ACCOUNTS,
} from '../../../stub/keyring-bridge';
import AccountListPage from '../pages/account-list-page';
import AddressListModal from '../pages/multichain/address-list-modal';
import HeaderNavbar from '../pages/header-navbar';
import { shortenAddress } from '../../../../ui/helpers/utils/util';

/**
 * Opens the account menu from the header and switches to the specified account.
 * Assumes the user is on the home page.
 *
 * @param driver - The webdriver instance.
 * @param accountName - The account label to switch to (e.g. 'Account 1').
 */
export async function openAccountMenuAndSwitchToAccount(
  driver: Driver,
  accountName: string,
): Promise<void> {
  const headerNavbar = new HeaderNavbar(driver);
  await headerNavbar.openAccountMenu();
  const accountListPage = new AccountListPage(driver);
  await accountListPage.switchToAccount(accountName);
}

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
