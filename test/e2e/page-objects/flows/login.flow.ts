import LoginPage from '../pages/login-page';
import HomePage from '../pages/home/homepage';
import HeaderNavbar from '../pages/header-navbar';
import { WALLET_PASSWORD, WINDOW_TITLES } from '../../constants';
import { Anvil } from '../../seeder/anvil';
import { Driver, PAGES } from '../../webdriver/driver';

/**
 * Stops background persistence via the extension runtime message.
 *
 * @param driver - The webdriver instance.
 * @returns Response confirming persistence was stopped.
 */
export const pausePersistence = async (
  driver: Driver,
): Promise<{ status: 'PERSISTENCE_STOPPED' }> => {
  const result = await driver.executeAsyncScript(`
    const callback = arguments[arguments.length - 1];
    const browser = globalThis.browser ?? globalThis.chrome;
    browser.runtime
      .sendMessage({ type: 'STOP_PERSISTENCE' })
      .then((response) => callback({ response }))
      .catch((error) =>
        callback({
          error: error?.message ?? error?.toString?.() ?? error,
        }),
      );
  `);

  if (result?.error) {
    throw new Error(result.error);
  }

  return (result?.response ?? {}) as { status: 'PERSISTENCE_STOPPED' };
};

/**
 * Waits for the extension to reload and the home screen to appear.
 *
 * @param driver - WebDriver instance.
 */
async function waitForRestart(driver: Driver): Promise<void> {
  await driver.waitUntil(
    async () => {
      await driver.navigate(PAGES.HOME, { waitForControllers: false });
      const title = await driver.driver.getTitle();
      // the browser will return an error message for our UI's HOME page until
      // the extension has restarted
      return title === WINDOW_TITLES.ExtensionInFullScreenView;
    },
    // reload and check title as quickly a possible
    { interval: 100, timeout: 10000 },
  );

  await driver.waitForControllersLoaded();
  const homePage = new HomePage(driver);
  await homePage.waitForLoadingLogoToDisappear();
}

/**
 * Reloads the extension, and waits for restart.
 *
 * @param driver - WebDriver instance.
 */
export const reloadExtension = async (driver: Driver): Promise<void> => {
  const extensionWindow = await driver.driver.getWindowHandle();
  const blankWindow = await driver.openNewPage('about:blank');

  await driver.switchToWindow(extensionWindow);
  await pausePersistence(driver);
  await driver.executeScript(
    `(globalThis.browser ?? globalThis.chrome).runtime.reload()`,
  );

  await driver.switchToWindow(blankWindow);

  // get a new tab ready to use (required for Firefox)
  await driver.openNewPage('about:blank');

  await waitForRestart(driver);
};

/**
 * Reloads the extension, unlocks with the wallet password, and waits for home readiness.
 * Does not use {@link login} (which navigates and runs balance checks).
 *
 * @param driver - WebDriver instance.
 */
export const reloadAndUnlock = async (driver: Driver): Promise<void> => {
  await reloadExtension(driver);
  const loginPage = new LoginPage(driver);
  await loginPage.checkPageIsLoaded();
  await loginPage.loginToHomepage(WALLET_PASSWORD);
  const homePage = new HomePage(driver);
  await homePage.ensurePageIsReady();
};

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
 * @param options.ignorePasskeyUnlock - Whether to ignore the passkey unlock and use password instead. Defaults to false.
 */
export const login = async (
  driver: Driver,
  options?: {
    expectedBalance?: string;
    localNode?: Anvil;
    password?: string;
    validateBalance?: boolean;
    waitForNonEvmAccounts?: boolean;
    ignorePasskeyUnlock?: boolean;
  },
) => {
  console.log('Navigate to unlock page and try to login with password');
  await driver.navigate();
  const loginPage = new LoginPage(driver);
  if (options?.ignorePasskeyUnlock === true) {
    await loginPage.checkPasskeyUnlockPageIsLoaded();
    await loginPage.clickUsePassword();
  }
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

/**
 * Locks MetaMask and waits for the passkey unlock page to be loaded.
 * Use this flow when you need to lock the wallet and then interact with the passkey unlock screen.
 *
 * @param driver - The webdriver instance.
 */
export const lockAndWaitForPasskeyUnlockPage = async (
  driver: Driver,
): Promise<void> => {
  console.log('Lock MetaMask and wait for passkey unlock page');
  const headerNavbar = new HeaderNavbar(driver);
  await headerNavbar.lockMetaMask();
  const loginPage = new LoginPage(driver);
  await loginPage.checkPasskeyUnlockPageIsLoaded();
};
