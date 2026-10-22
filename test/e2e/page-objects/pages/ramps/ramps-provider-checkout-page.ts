import { Driver } from '../../../webdriver/driver';

/**
 * Local `ramp-provider` checkout page opened by the extension after Continue.
 * The page is served by the standalone mock provider, not the extension.
 */
class RampsProviderCheckoutPage {
  private driver: Driver;

  private readonly completePurchaseLink = {
    css: 'a.outcome-link',
    text: 'Complete purchase',
  };

  private readonly providerPageTitle = {
    text: 'Mock Ramp Provider',
    tag: 'title',
  };

  constructor(driver: Driver) {
    this.driver = driver;
  }

  async checkPageIsLoaded(): Promise<void> {
    await this.driver.waitForSelector(this.providerPageTitle);
    await this.driver.waitForSelector(this.completePurchaseLink);
  }

  async clickCompletePurchase(): Promise<void> {
    await this.driver.clickElement(this.completePurchaseLink);
  }
}

export default RampsProviderCheckoutPage;
