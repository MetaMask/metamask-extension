import { Driver } from '../../webdriver/driver';
import { DEFAULT_GANACHE_ETH_BALANCE_DEC } from '../../constants';
import { WALLET_PASSWORD } from '../../helpers';
import { getApp } from '../pages/app';
import HomePage from '../pages/homepage';

/**
 * This method unlocks the wallet and verifies that the user lands on the homepage with the expected balance. It is designed to be the initial step in setting up a test environment.
 *
 * @param driver - The webdriver instance.
 * @param password - The password used to unlock the wallet. Defaults to WALLET_PASSWORD.
 * @param expectedBalance - The expected balance to be displayed on the homepage after successful login. Defaults to DEFAULT_GANACHE_ETH_BALANCE_DEC, reflecting common usage in test setups.
 */
export const loginWithBalanceValidation = async (
  driver: Driver,
  password: string = WALLET_PASSWORD,
  expectedBalance: string = DEFAULT_GANACHE_ETH_BALANCE_DEC,
): Promise<HomePage> => {
  console.log('Navigate to unlock page and try to login with pasword');
  const app = await getApp(driver);
  const loginPage = await app.getLoginPage();
  const homePage = await loginPage.login(password);
  await homePage.check_expectedBalanceIsDisplayed(expectedBalance);
  return homePage;
};
