import { Driver } from '../../webdriver/driver';
import {
  KNOWN_PUBLIC_KEY_ADDRESSES,
  KNOWN_QR_ACCOUNTS,
} from '../../../stub/keyring-bridge';
import AccountListPage from '../pages/account-list-page';
import AddressListModal from '../pages/multichain/address-list-modal';
import ConnectHardwareWalletPage from '../pages/hardware-wallet/connect-hardware-wallet-page';
import HeaderNavbar from '../pages/header-navbar';
import HomePage from '../pages/home/homepage';
import SelectHardwareWalletAccountPage from '../pages/hardware-wallet/select-hardware-wallet-account-page';
import { shortenAddress } from '../../../../ui/helpers/utils/util';

export async function switchToHardwareAccount(
  driver: Driver,
  accountLabel: string,
): Promise<HomePage> {
  const headerNavbar = new HeaderNavbar(driver);
  await headerNavbar.openAccountMenu();
  const accountListPage = new AccountListPage(driver);
  await accountListPage.checkPageIsLoaded();
  await accountListPage.selectAccount(accountLabel);
  const homePage = new HomePage(driver);
  await homePage.checkPageIsLoaded();
  return homePage;
}

export async function connectLedgerDevice(driver: Driver): Promise<void> {
  const headerNavbar = new HeaderNavbar(driver);
  console.log('[connectLedgerDevice] Opening account menu');
  await headerNavbar.openAccountMenu();

  const accountListPage = new AccountListPage(driver);
  await accountListPage.checkPageIsLoaded();
  console.log('[connectLedgerDevice] Opening connect hardware wallet modal');
  await accountListPage.openConnectHardwareWalletModal();

  const connectPage = new ConnectHardwareWalletPage(driver);
  await connectPage.checkPageIsLoaded();
  console.log('[connectLedgerDevice] Clicking connect Ledger button');
  await connectPage.clickConnectLedgerButton();
  console.log('[connectLedgerDevice] Clicking continue button');
  await connectPage.clickContinueButton(30000);

  const selectPage = new SelectHardwareWalletAccountPage(driver);
  await selectPage.checkPageIsLoaded();
  console.log('[connectLedgerDevice] Unlocking account 1');
  await selectPage.unlockAccount(1);
  console.log('[connectLedgerDevice] Account unlocked');

  const homePage = new HomePage(driver);
  await homePage.checkPageIsLoaded();
  console.log('[connectLedgerDevice] Done, home page loaded');
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
