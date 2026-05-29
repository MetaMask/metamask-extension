import { Driver } from '../../webdriver/driver';
import {
  KNOWN_PUBLIC_KEY_ADDRESSES,
  KNOWN_QR_ACCOUNTS,
} from '../../../stub/keyring-bridge';
import AccountListPage from '../pages/account-list-page';
import AddressListModal from '../pages/multichain/address-list-modal';
import NonEvmHomepage from '../pages/home/non-evm-homepage';
import { shortenAddress } from '../../../../ui/helpers/utils/util';

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
 * Switches to the specified account via the NonEvm homepage account menu.
 *
 * @param driver
 * @param accountName
 */
export const switchToNonEvmAccount = async (
  driver: Driver,
  accountName: string,
): Promise<void> => {
  const nonEvmHomepage = new NonEvmHomepage(driver);
  await nonEvmHomepage.checkPageIsLoaded();
  await nonEvmHomepage.headerNavbar.openAccountMenu();

  const accountListPage = new AccountListPage(driver);
  await accountListPage.checkPageIsLoaded();
  await accountListPage.checkAccountDisplayedInAccountList(accountName);
  await accountListPage.switchToAccount(accountName);
  await nonEvmHomepage.headerNavbar.checkAccountLabel(accountName);
};
