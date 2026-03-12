import assert from 'node:assert/strict';
import { Driver } from '../../webdriver/driver';
import DeepLink from '../pages/deep-link-page';
import LoginPage from '../pages/login-page';

/**
 * Opens a deep link URL, verifies the checkbox, navigates through the interstitial page,
 * handles login if locked, and verifies the target page has loaded.
 * This is the complete navigation flow for deep link route tests.
 *
 * @param driver - The webdriver instance.
 * @param deepLinkUrl - The prepared deep link URL to navigate to.
 * @param locked - Whether the wallet is 'locked' or 'unlocked'.
 * @param shouldShowCheckbox - Whether the checkbox should be rendered (based on signing status).
 * @param targetPageClass - The page object class to verify after navigation (e.g., HomePage, SwapPage).
 * @param password - Optional password to use if wallet is locked.
 */
export const navigateDeepLinkToDestination = async (
  driver: Driver,
  deepLinkUrl: string,
  locked: 'locked' | 'unlocked',
  shouldShowCheckbox: boolean,
  targetPageClass: new (driverInstance: Driver) => {
    checkPageIsLoaded: () => Promise<void>;
  },
  password?: string,
): Promise<void> => {
  console.log('Opening deep link URL');
  await driver.openNewURL(deepLinkUrl);

  const deepLink = new DeepLink(driver);
  console.log('Checking if deep link page is loaded');
  await deepLink.checkPageIsLoaded();

  // we should render the checkbox when the link is "signed"
  console.log('Checking if deep link interstitial checkbox exists');
  const hasCheckbox = await deepLink.hasSkipDeepLinkInterstitialCheckBox();
  assert.equal(hasCheckbox, shouldShowCheckbox, 'Checkbox presence mismatch');

  console.log('Clicking continue button');
  await deepLink.clickContinueButton();

  // If wallet is locked, handle the login flow
  if (locked === 'locked') {
    console.log('Checking if login page is loaded (locked scenario)');
    const loginPage = new LoginPage(driver);
    await loginPage.checkPageIsLoaded();
    console.log('Logging in to homepage (locked scenario)');
    await loginPage.loginToHomepage(password);
  }

  // check that the target page has been loaded!
  const TargetPage = targetPageClass;
  const targetPage = new TargetPage(driver);
  console.log('Checking if target page is loaded');
  await targetPage.checkPageIsLoaded();
};
