import LoginPage from '../pages/login-page';
import HomePage from '../pages/home/homepage';
import HeaderNavbar from '../pages/header-navbar';
import { Driver } from '../../webdriver/driver';
import { Anvil } from '../../seeder/anvil';
import { Ganache } from '../../seeder/ganache';

/**
 * Unlocks the wallet and lands the user on the homepage.
 * By default, validates the displayed balance. Use {@link localNode} or {@link expectedBalance}
 * for specific checks, or set {@link validateBalance} to false to skip validation entirely.
 *
 * @param driver - The webdriver instance.
 * @param options - Optional configuration for the login flow.
 * @param options.expectedBalance - An expected balance string to verify on the homepage.
 * @param options.localNode - A local node instance whose balance should be verified.
 * @param options.password - The password used to unlock the wallet.
 * @param options.validateBalance - Whether to verify the balance is displayed. Defaults to true.
 * @param options.waitForNonEvmAccounts - Whether to wait for non-EVM accounts to load on the homepage. Defaults to true; set to false to skip.
 */
export const login = async (
  driver: Driver,
  options?: {
    expectedBalance?: string;
    localNode?: Ganache | Anvil;
    password?: string;
    validateBalance?: boolean;
    waitForNonEvmAccounts?: boolean;
  },
) => {
  console.log('Navigate to unlock page and try to login with password');
  await driver.navigate();
  const loginPage = new LoginPage(driver);
  await loginPage.checkPageIsLoaded();
  await loginPage.loginToHomepage(options?.password);

  const homePage = new HomePage(driver);
  await homePage.checkPageIsLoaded();
  if (options?.waitForNonEvmAccounts !== false) {
    await homePage.waitForNonEvmAccountsLoaded();
  }

  if (options?.localNode) {
    await homePage.checkLocalNodeBalanceIsDisplayed(options.localNode);
  } else if (options?.expectedBalance !== undefined) {
    await homePage.checkExpectedBalanceIsDisplayed(options.expectedBalance);
  } else if (options?.validateBalance !== false) {
    // defaults to 25 ETH
    await homePage.checkExpectedBalanceIsDisplayed();
  }
};

/**
 * Locks MetaMask and waits for the login (unlock) page to be loaded.
 * Use this flow when you need to lock the wallet and then interact with the login screen.
 *
 * @param driver - The webdriver instance.
 */
export const lockAndWaitForLoginPage = async (
  driver: Driver,
): Promise<void> => {
  console.log('Lock MetaMask and wait for login page');
  const headerNavbar = new HeaderNavbar(driver);
  await headerNavbar.lockMetaMask();
  const loginPage = new LoginPage(driver);
  await loginPage.checkPageIsLoaded();
};
