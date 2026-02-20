import { Driver } from '../../../webdriver/driver';
import { PERPS_HOME_ROUTE } from '../../../tests/perps/helpers';

/**
 * Page object for the Perps Home page.
 *
 * @see ui/pages/perps/perps-home-page.tsx
 */
export class PerpsHomePage {
  private readonly driver: Driver;

  private readonly perpsHomeBackButton = {
    testId: 'perps-home-back-button',
  };

  private readonly perpsHomePage = {
    testId: 'perps-home-page',
  };

  private readonly perpsHomeSearchButton = {
    testId: 'perps-home-search-button',
  };

  constructor(driver: Driver) {
    this.driver = driver;
  }

  /**
   * Waits for the Perps Home page to be loaded and visible.
   */
  async checkPageIsLoaded(): Promise<void> {
    await this.driver.waitForSelector(this.perpsHomePage);
  }

  /**
   * Navigates to the Perps Home route via hash and waits for the page to load.
   */
  async navigateToPerpsHome(): Promise<void> {
    await this.driver.executeScript(
      `window.location.hash = '${PERPS_HOME_ROUTE}';`,
    );
    await this.checkPageIsLoaded();
  }

  /**
   * Checks that the Perps Home page back button is visible.
   */
  async checkBackButtonIsVisible(): Promise<void> {
    await this.driver.waitForSelector(this.perpsHomeBackButton);
  }

  /**
   * Checks that the Perps Home page search button is visible.
   */
  async checkSearchButtonIsVisible(): Promise<void> {
    await this.driver.waitForSelector(this.perpsHomeSearchButton);
  }

  /**
   * Waits for the positions section to be visible (mock positions loaded).
   */
  async waitForPositionsSection(): Promise<void> {
    await this.driver.waitForSelector({ testId: 'perps-positions-section' });
  }

  /**
   * Returns the number of position cards currently displayed.
   */
  async getPositionCardsCount(): Promise<number> {
    const elements = await this.driver.findElements(
      '[data-testid^="position-card-"]',
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
