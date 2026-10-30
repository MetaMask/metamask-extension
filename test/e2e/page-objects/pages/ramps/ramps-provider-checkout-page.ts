import { WINDOW_TITLES } from '../../../constants';
import { Driver } from '../../../webdriver/driver';

/**
 * Local `ramp-provider` checkout page opened by the extension after Continue.
 * The page is served by the standalone mock provider, not the extension.
 */
class RampsProviderCheckoutPage {
  private readonly completePurchaseLink = {
    css: 'a.outcome-link',
    text: 'Complete purchase',
  };

  private driver: Driver;

  private readonly providerPageTitle = {
    text: WINDOW_TITLES.MockRampProvider,
    tag: 'title',
  };

  constructor(driver: Driver) {
    this.driver = driver;
  }

  async checkPageIsLoaded(): Promise<void> {
    await this.driver.waitForSelector(this.providerPageTitle);
    await this.driver.waitForSelector(this.completePurchaseLink);
  }

  /**
   * Completes the purchase, then waits for the provider tab to close once the
   * extension's checkout watcher resolves the callback.
   */
  async clickCompletePurchase(): Promise<void> {
    await this.driver.clickElementAndWaitForWindowToClose(
      this.completePurchaseLink,
    );
  }
}

export default RampsProviderCheckoutPage;
