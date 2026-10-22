import { Driver } from '../../webdriver/driver';
import ActivityTab from '../pages/home/activity-tab';
import HomePage from '../pages/home/homepage';
import RampsBuildQuotePage from '../pages/ramps/ramps-build-quote-page';
import RampsCompleteBuyPage from '../pages/ramps/ramps-complete-buy-page';
import RampsProviderCheckoutPage from '../pages/ramps/ramps-provider-checkout-page';
import RampsTokenSelectionPage from '../pages/ramps/ramps-token-selection-page';

/**
 * Switches to the extension Activity tab opened by the ramps checkout watcher.
 *
 * The watcher opens `#/activity` in a new tab after resolving the callback.
 *
 * @param driver - WebDriver instance.
 */
async function switchToActivityWindow(driver: Driver): Promise<void> {
  await driver.wait(async () => {
    const handles = await driver.getAllWindowHandles();
    for (const handle of handles) {
      await driver.switchToWindow(handle);
      const url = await driver.getCurrentUrl();
      if (url.includes('#/activity')) {
        return true;
      }
    }
    return false;
  }, 30000);
}

/**
 * Home Buy -> token selection -> build quote with a live quote.
 *
 * @param driver - WebDriver instance.
 * @param amount - Fiat amount to quote.
 * @returns The complete-buy page object.
 */
export async function startRampsBuyFromHome(
  driver: Driver,
  amount = '100',
): Promise<RampsCompleteBuyPage> {
  await new HomePage(driver).clickOnBuyButton();

  const tokenSelectionPage = new RampsTokenSelectionPage(driver);
  await tokenSelectionPage.checkPageIsLoaded();
  await tokenSelectionPage.selectToken({ chainId: '0x1', symbol: 'ETH' });

  const buildQuotePage = new RampsBuildQuotePage(driver);
  await buildQuotePage.checkPageIsLoaded();
  await buildQuotePage.checkProviderLabel('Mock HTTP Provider (Staging)');
  await buildQuotePage.enterAmount(amount);
  await buildQuotePage.waitForQuote();
  await buildQuotePage.clickContinue();

  const completeBuyPage = new RampsCompleteBuyPage(driver);
  await completeBuyPage.checkPageIsLoaded();
  return completeBuyPage;
}

/**
 * Completes the provider checkout tab and verifies the resolved order in
 * Activity.
 *
 * @param driver - WebDriver instance.
 * @param providerName - Provider name expected in the Activity row.
 */
export async function completeRampsCheckoutInProviderTab(
  driver: Driver,
  providerName = 'Mock HTTP Provider (Staging)',
): Promise<void> {
  await driver.switchToWindowWithTitle('Mock Ramp Provider');
  const providerCheckoutPage = new RampsProviderCheckoutPage(driver);
  await providerCheckoutPage.checkPageIsLoaded();

  const providerHandle = await driver.getCurrentWindowHandle();
  await providerCheckoutPage.clickCompletePurchase();
  await driver.waitForWindowToClose(providerHandle);
  await switchToActivityWindow(driver);

  const activityTab = new ActivityTab(driver);
  await activityTab.selectNetwork('0x1');
  await activityTab.checkRampsOrderIsDisplayed(providerName);
}
