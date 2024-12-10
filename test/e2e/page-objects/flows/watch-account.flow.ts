import { Driver } from '../../webdriver/driver';
import HomePage from '../pages/home/homepage';
import AccountListPage from '../pages/account-list-page';
import { loginWithBalanceValidation } from './login.flow';

/**
 * Initiates the flow of watching an EOA address.
 *
 * @param driver - The WebDriver instance.
 * @param address - The EOA address that is to be watched.
 * @param unlockWalletFirst - A boolean indicating whether the wallet should be unlocked before attempting to watch the address. Default is true.
 */
export async function watchEoaAddress(
  driver: Driver,
  address: string,
  unlockWalletFirst: boolean = true,
): Promise<void> {
  if (unlockWalletFirst) {
    await loginWithBalanceValidation(driver);
  }
  // watch a new EOA
  const homePage = new HomePage(driver);
  await homePage.headerNavbar.openAccountMenu();
  const accountListPage = new AccountListPage(driver);
  await accountListPage.check_pageIsLoaded();
  await accountListPage.addEoaAccount(address);
  await homePage.check_pageIsLoaded();
}
