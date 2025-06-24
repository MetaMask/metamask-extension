import LoginPage from '../pages/login-page';
import HomePage from '../pages/home/homepage';
import { Driver } from '../../webdriver/driver';
import { Anvil } from '../../seeder/anvil';
import { Ganache } from '../../seeder/ganache';

/**
 * This method unlocks the wallet and lands the user on the homepage.
 *
 * @param driver - The webdriver instance.
 * @param password - The password used to unlock the wallet.
 */
export const loginWithoutBalanceValidation = async (
  driver: Driver,
  password?: string,
) => {
  console.log('Navigate to unlock page and try to login with password');
  await driver.navigate();
  const loginPage = new LoginPage(driver);
  await loginPage.check_pageIsLoaded();
  await loginPage.loginToHomepage(password);

  // user should land on homepage after successfully logging in with password
  const homePage = new HomePage(driver);
  await homePage.check_pageIsLoaded();
};

/**
 * This method unlocks the wallet and verifies that the user lands on the homepage with the expected balance. It is designed to be the initial step in setting up a test environment.
 *
 * @param driver - The webdriver instance.
 * @param localNode - The local node server instance
 * @param password - The password used to unlock the wallet.
 */
export const loginWithBalanceValidation = async (
  driver: Driver,
  localNode?: Ganache | Anvil,
  password?: string,
) => {
  await loginWithoutBalanceValidation(driver, password);
  const homePage = new HomePage(driver);

  // Verify the expected balance on the homepage
  if (localNode) {
    await homePage.check_localNodeBalanceIsDisplayed(localNode);
  } else {
    await homePage.check_expectedBalanceIsDisplayed();
  }
};
