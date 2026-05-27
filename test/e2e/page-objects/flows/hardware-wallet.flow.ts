import { Driver } from '../../webdriver/driver';
import AccountListPage from '../pages/account-list-page';
import ConnectHardwareWalletPage from '../pages/hardware-wallet/connect-hardware-wallet-page';
import HeaderNavbar from '../pages/header-navbar';
import HomePage from '../pages/home/homepage';
import SelectHardwareWalletAccountPage from '../pages/hardware-wallet/select-hardware-wallet-account-page';

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
