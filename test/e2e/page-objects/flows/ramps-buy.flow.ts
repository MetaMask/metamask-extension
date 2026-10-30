import { WINDOW_TITLES } from '../../constants';
import { Driver } from '../../webdriver/driver';
import ActivityTab from '../pages/home/activity-tab';
import HomePage from '../pages/home/homepage';
import { NetworkId } from '../pages/networks/select-network-modal';
import RampsBuildQuotePage from '../pages/ramps/ramps-build-quote-page';
import RampsCompleteBuyPage from '../pages/ramps/ramps-complete-buy-page';
import RampsProviderCheckoutPage from '../pages/ramps/ramps-provider-checkout-page';
import RampsTokenSelectionPage from '../pages/ramps/ramps-token-selection-page';
import { switchToNetworkFromNetworkSelect } from './network.flow';

// Token rows use hex chain ids, while the network filter takes CAIP ids.
const RAMPS_BUY_TOKEN_CHAIN_ID = '0x1';
const RAMPS_BUY_TOKEN_SYMBOL = 'ETH';

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
  await tokenSelectionPage.selectToken({
    chainId: RAMPS_BUY_TOKEN_CHAIN_ID,
    symbol: RAMPS_BUY_TOKEN_SYMBOL,
  });

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
  await driver.switchToWindowWithTitle(WINDOW_TITLES.MockRampProvider);
  const providerCheckoutPage = new RampsProviderCheckoutPage(driver);
  await providerCheckoutPage.checkPageIsLoaded();

  await providerCheckoutPage.clickCompletePurchase();
  await switchToActivityWindow(driver);

  await switchToNetworkFromNetworkSelect(driver, NetworkId.ETHEREUM);

  const activityTab = new ActivityTab(driver);
  await activityTab.checkRampsOrderIsDisplayed(
    providerName,
    RAMPS_BUY_TOKEN_SYMBOL,
  );
}
