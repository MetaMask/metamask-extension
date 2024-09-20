import LoginPage from '../pages/login-page';
import HomePage from '../pages/homepage';
import { Driver } from '../../webdriver/driver';
import { DEFAULT_GANACHE_ETH_BALANCE_DEC } from '../../constants';
import { WALLET_PASSWORD } from '../../helpers';

/**
 * This method unlocks the wallet and verifies that the user lands on the homepage with the expected balance. It is designed to be the initial step in setting up a test environment.
 *
 * @param driver - The webdriver instance.
 * @param expectedBalance - The expected balance to be displayed on the homepage after successful login. Defaults to DEFAULT_GANACHE_ETH_BALANCE_DEC, reflecting common usage in test setups.
 * @param password - The password used to unlock the wallet. Defaults to WALLET_PASSWORD.
 */
export const loginWithBalanceValidation = async (
  driver: Driver,
  expectedBalance: string = DEFAULT_GANACHE_ETH_BALANCE_DEC,
  password: string = WALLET_PASSWORD,
) => {
  console.log('Navigate to unlock page and try to login with pasword');
  await driver.navigate();
  const loginPage = new LoginPage(driver);
  await loginPage.check_pageIsLoaded();
  await loginPage.fillPassword(password);
  await loginPage.clickUnlockButton();

  // user should land on homepage after successfully logging in with password
  const homePage = new HomePage(driver);
  await homePage.check_pageIsLoaded();
  await homePage.check_expectedBalanceIsDisplayed(expectedBalance);
};
