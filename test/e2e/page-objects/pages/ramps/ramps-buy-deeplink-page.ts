import { Driver } from '../../../webdriver/driver';

/**
 * Destination page for `/buy` deep links with a token intent when the
 * unified buy (`rampsEnabled`) feature flag is on and the ramps catalog is
 * populated: the entry page pre-selects the link's token and the flow lands
 * on build-quote. Reaching build-quote proves the full routing chain —
 * intent parsed from the link, token found in the catalog, and accepted by
 * the RampsController — not merely that the router landed in the app.
 */
class RampsBuyDeepLinkPage {
  private driver: Driver;

  // Private selector properties (sorted alphabetically)
  private readonly rampsBuildQuoteHashPath = '/ramps/build-quote';

  private readonly rampsBuildQuoteScreen = {
    css: '[data-testid="ramps-build-quote-screen"]',
  };

  constructor(driver: Driver) {
    this.driver = driver;
  }

  // Public methods (sorted alphabetically)
  async checkPageIsLoaded(): Promise<void> {
    await this.driver.waitUntil(
      async () => {
        const url = await this.driver.getCurrentUrl();
        if (!new URL(url).hash.includes(this.rampsBuildQuoteHashPath)) {
          return false;
        }
        const hasBuildQuoteScreen = await this.driver.executeScript(
          `return Boolean(document.querySelector('${this.rampsBuildQuoteScreen.css}'));`,
        );
        return Boolean(hasBuildQuoteScreen);
      },
      { timeout: 15000, interval: 500 },
    );
  }
}

export default RampsBuyDeepLinkPage;
