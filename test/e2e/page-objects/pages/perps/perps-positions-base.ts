import { Driver } from '../../../webdriver/driver';

/**
 * Base class with shared position-related selectors and methods
 * used by both PerpsTabPage and PerpsHomePage.
 */
export class PerpsPositionsBase {
  protected readonly driver: Driver;

  protected readonly accountOverviewPerpsTab = {
    testId: 'account-overview__perps-tab',
  };

  private readonly perpsPositionsSection = {
    testId: 'perps-positions-section',
  };

  constructor(driver: Driver) {
    this.driver = driver;
  }

  /**
   * Clicks the position card for the given symbol (navigates to market detail).
   *
   * @param symbol - The trading pair symbol (e.g. 'ETH', 'BTC').
   */
  async clickPositionCard(symbol: string): Promise<void> {
    await this.driver.clickElement({ testId: `position-card-${symbol}` });
  }

  /**
   * Waits for a position card for the given symbol to be visible.
   *
   * @param symbol - The trading pair symbol (e.g. 'ETH', 'BTC').
   */
  async waitForPositionCard(symbol: string): Promise<void> {
    await this.driver.waitForSelector({
      testId: `position-card-${symbol}`,
    });
  }

  /**
   * Waits until the position card for `symbol` contains the given text fragment
   * (e.g. size row "2.25 ETH" or leverage/direction "3x short").
   *
   * @param symbol - Asset symbol (e.g. 'ETH', 'BTC').
   * @param textFragment - Substring that must appear in the card text.
   */
  async waitForPositionCardContains(
    symbol: string,
    textFragment: string,
  ): Promise<void> {
    await this.driver.waitForSelector({
      testId: `position-card-${symbol}`,
      text: textFragment,
    });
  }

  /**
   * Waits until the position card for `symbol` shows the given size line
   * (e.g. "2.25 ETH" on the Perps home positions list).
   *
   * @param symbol - Asset symbol (e.g. 'ETH').
   * @param sizeLabel - Size row text as shown on the card (e.g. '2.25 ETH').
   */
  async waitForPositionCardSize(
    symbol: string,
    sizeLabel: string,
  ): Promise<void> {
    await this.waitForPositionCardContains(symbol, sizeLabel);
  }

  /**
   * Waits for the positions section to be visible (mock positions loaded).
   */
  async waitForPositionsSection(): Promise<void> {
    await this.driver.waitForSelector(this.perpsPositionsSection);
  }
}
