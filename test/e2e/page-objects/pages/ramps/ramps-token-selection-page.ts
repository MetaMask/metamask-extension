import { Driver } from '../../../webdriver/driver';

/**
 * Ramps token selection screen. Reached from the wallet Buy button when no
 * asset intent is supplied, e.g. the home overview Buy action.
 */
class RampsTokenSelectionPage {
  private driver: Driver;

  private readonly tokenSelectionScreen =
    '[data-testid="ramps-token-selection-screen"]';

  private readonly tokenSelectionScrollContainer =
    '[data-testid="ramps-token-selection-scroll-container"]';

  constructor(driver: Driver) {
    this.driver = driver;
  }

  async checkPageIsLoaded(): Promise<void> {
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
