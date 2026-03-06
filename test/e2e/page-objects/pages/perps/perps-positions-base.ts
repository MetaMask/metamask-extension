import { Driver } from '../../../webdriver/driver';

/**
 * Base class with shared position-related selectors and methods
 * used by both PerpsTabPage and PerpsHomePage.
 */
export class PerpsPositionsBase {
  protected readonly driver: Driver;

  private readonly perpsPositionsSection = {
    testId: 'perps-positions-section',
  };

  constructor(driver: Driver) {
    this.driver = driver;
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
   * Waits for the positions section to be visible (mock positions loaded).
   */
  async waitForPositionsSection(): Promise<void> {
    await this.driver.waitForSelector(this.perpsPositionsSection);
  }
}
