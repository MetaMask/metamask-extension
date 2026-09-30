import { Driver } from '../../../webdriver/driver';

/**
 * Destination page for param-less `/buy` deep links when the unified buy
 * (`rampsEnabled`) feature flag is on: routed into the in-app flow with
 * nothing to pre-select, so it opens token selection instead of build-quote.
 */
class RampsTokenSelectionPage {
  private driver: Driver;

  // Private selector properties (sorted alphabetically)
  private readonly rampsTokenSelectionBackButton =
    '[data-testid="ramps-token-selection-back"]';

  private readonly rampsTokenSelectionHashPath = '#/ramps/token-selection';

  constructor(driver: Driver) {
    this.driver = driver;
  }

  // Public methods (sorted alphabetically)
  async checkPageIsLoaded(): Promise<void> {
    await this.driver.waitForUrlContaining({
      url: this.rampsTokenSelectionHashPath,
    });
    await this.driver.waitForSelector(this.rampsTokenSelectionBackButton);
  }
}

export default RampsTokenSelectionPage;
