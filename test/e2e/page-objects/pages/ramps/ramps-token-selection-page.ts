import { Driver } from '../../../webdriver/driver';

/**
 * Destination page for param-less `/buy` deep links when the unified buy
 * (`rampsEnabled`) feature flag is on: routed into the in-app flow with
 * nothing to pre-select, so it opens token selection instead of build-quote.
 */
class RampsTokenSelectionPage {
  private driver: Driver;

  // Private selector properties (sorted alphabetically)
  private readonly rampsTokenSelectionHashPath = '/ramps/token-selection';

  constructor(driver: Driver) {
    this.driver = driver;
  }

  // Public methods (sorted alphabetically)
  async checkPageIsLoaded(): Promise<void> {
    await this.driver.waitUntil(
      async () => {
        const url = await this.driver.getCurrentUrl();
        return new URL(url).hash.includes(this.rampsTokenSelectionHashPath);
      },
      { timeout: 15000, interval: 500 },
    );
  }
}

export default RampsTokenSelectionPage;
