import { Driver } from '../../../webdriver/driver';

/**
 * Ramps complete-buy interstitial shown after the provider checkout tab opens.
 */
class RampsCompleteBuyPage {
  private readonly completeBuyScreen =
    '[data-testid="ramps-complete-buy-screen"]';

  private driver: Driver;

  constructor(driver: Driver) {
    this.driver = driver;
  }

  async checkPageIsLoaded(): Promise<void> {
    await this.driver.waitForSelector(this.completeBuyScreen);
  }
}

export default RampsCompleteBuyPage;
