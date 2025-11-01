import { Driver } from '../../webdriver/driver';
import {
  KNOWN_PUBLIC_KEY_ADDRESSES,
  KNOWN_QR_ACCOUNTS,
} from '../../../stub/keyring-bridge';
import AccountListPage from '../../page-objects/pages/account-list-page';
import AddressListModal from '../../page-objects/pages/multichain/address-list-modal';
import { shortenAddress } from '../../../../ui/helpers/utils/util';

export async function checkAccountAddressDisplayedInAccountList(
  driver: Driver,
  type: string,
  count: number,
): Promise<void> {
  console.log(`Check that account address is displayed in account list`);
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
    await accountListPage.clickMultichainAccountMenuItem('Addresses');
    await addressListModal.checkNetworkAddressIsDisplayed(
      shortenAddress(addresses[index].address),
    );
    await addressListModal.goBack();
  }
}
