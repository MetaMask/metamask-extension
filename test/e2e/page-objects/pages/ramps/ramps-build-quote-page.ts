import { Driver } from '../../../webdriver/driver';

/**
 * The ramps build-quote screen. Deep links with a token intent land here when
 * the unified buy (`rampsEnabled`) feature flag is on and the ramps catalog
 * is populated: the entry page pre-selects the link's token, so reaching
 * build-quote with the right token proves the full routing chain — intent
 * parsed from the link, token found in the catalog, and accepted by the
 * RampsController — not merely that the router landed in the app.
 */
class RampsBuildQuotePage {
  private driver: Driver;

  // Private selector properties (sorted alphabetically)
  private readonly rampsBuildQuoteHashPath = '#/ramps/build-quote';

  private readonly rampsBuildQuoteScreen =
    '[data-testid="ramps-build-quote-screen"]';

  constructor(driver: Driver) {
    this.driver = driver;
  }

  // Public methods (sorted alphabetically)
  async checkPageIsLoaded(): Promise<void> {
    await this.driver.waitForUrlContaining({
      url: this.rampsBuildQuoteHashPath,
    });
    await this.driver.waitForSelector(this.rampsBuildQuoteScreen);
  }

  /**
   * Checks the screen title ("Buy <symbol>"), which shows the token the flow
   * pre-selected.
   *
   * @param symbol - The expected token symbol.
   */
  async checkSelectedToken(symbol: string): Promise<void> {
    await this.driver.waitForSelector({
      css: this.rampsBuildQuoteScreen,
      text: `Buy ${symbol}`,
    });
  }
}

export default RampsBuildQuotePage;
