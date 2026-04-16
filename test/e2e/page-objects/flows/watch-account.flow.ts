import { Driver } from '../../webdriver/driver';
import HomePage from '../pages/home/homepage';
import AccountListPage from '../pages/account-list-page';

/**
 * Initiates the flow of watching an EOA address.
 *
 * @param driver - The WebDriver instance.
 * @param address - The EOA address that is to be watched.
 */
export async function watchEoaAddress(
  driver: Driver,
  address: string,
): Promise<void> {
  // watch a new EOA
  const homePage = new HomePage(driver);
  await homePage.headerNavbar.openAccountMenu();
  const accountListPage = new AccountListPage(driver);
  await accountListPage.checkPageIsLoaded();
  await accountListPage.addEoaAccount(address);
  await homePage.checkPageIsLoaded();
}
