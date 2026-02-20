import { Driver } from '../../../webdriver/driver';
import { PERPS_TAB_HASH } from '../../../tests/perps/helpers';

/**
 * Page object for the Perps tab on the account overview (home).
 * Covers the tab that shows positions and orders from the mock PerpsStreamManager.
 *
 * @see ui/components/app/perps/perps-tab-view.tsx
 */
export class PerpsTabPage {
  private readonly driver: Driver;

  private readonly accountOverviewAssetTab = {
    testId: 'account-overview__asset-tab',
  };

  private readonly perpsPositionsSection = {
    testId: 'perps-positions-section',
  };

  private readonly positionCardsSelector = '[data-testid^="position-card-"]';

  constructor(driver: Driver) {
    this.driver = driver;
  }

  /**
   * Waits for the account overview to be loaded (tabs visible).
   */
  async waitForAccountOverviewLoaded(): Promise<void> {
    await this.driver.waitForSelector(this.accountOverviewAssetTab);
  }

  /**
   * Opens the Perps tab by setting the window hash to the perps tab query.
   */
  async openPerpsTab(): Promise<void> {
    await this.driver.executeScript(
      `window.location.hash = '${PERPS_TAB_HASH}';`,
    );
  }

  /**
   * Waits for the positions section to be visible (mock positions loaded).
   */
  async waitForPositionsSection(): Promise<void> {
    await this.driver.waitForSelector(this.perpsPositionsSection);
  }

  /**
   * Returns the number of position cards currently displayed.
   */
  async getPositionCardsCount(): Promise<number> {
    const elements = await this.driver.findElements(
      this.positionCardsSelector,
    );
    return elements.length;
  }

  /**
   * Waits for a position card for the given symbol to be visible.
   */
  async waitForPositionCard(symbol: string): Promise<void> {
    await this.driver.waitForSelector({
      testId: `position-card-${symbol}`,
    });
  }
}
