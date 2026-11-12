import { Driver } from '../../../webdriver/driver';

/**
 * Ramps token selection screen. Reached from the wallet Buy button when no
 * asset intent is supplied, and the destination for param-less `/buy` deep
 * links, which route into the in-app flow with nothing to pre-select.
 */
class RampsTokenSelectionPage {
  private driver: Driver;

  // Private selector properties (sorted alphabetically)
  private readonly rampsTokenSelectionBackButton =
    '[data-testid="ramps-token-selection-back"]';

  private readonly rampsTokenSelectionHashPath = '#/ramps/token-selection';

  private readonly tokenSelectionScreen =
    '[data-testid="ramps-token-selection-screen"]';

  private readonly tokenSelectionScrollContainer =
    '[data-testid="ramps-token-selection-scroll-container"]';

  constructor(driver: Driver) {
    this.driver = driver;
  }

  // Public methods (sorted alphabetically)
  async checkPageIsLoaded(): Promise<void> {
    await this.driver.waitForUrlContaining({
      url: this.rampsTokenSelectionHashPath,
    });
    await this.driver.waitForSelector(this.rampsTokenSelectionBackButton);
    await this.driver.waitForSelector(this.tokenSelectionScreen);
    await this.driver.waitForSelector(this.tokenSelectionScrollContainer);
  }

  /**
   * Selects a catalog token by chain and symbol.
   *
   * @param options - Token selection options.
   * @param options.chainId - Hex chain id used in the row test id.
   * @param options.symbol - Token symbol used in the row test id.
   */
  async selectToken({
    chainId,
    symbol,
  }: {
    chainId: string;
    symbol: string;
  }): Promise<void> {
    await this.driver.clickElement(
      `[data-testid="token-asset-${chainId}-${symbol}"]`,
    );
  }
}

export default RampsTokenSelectionPage;
