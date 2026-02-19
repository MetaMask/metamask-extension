import { Driver } from '../../../webdriver/driver';

/**
 * Page object for the Perps Home page.
 *
 * @see ui/pages/perps/perps-home-page.tsx
 */
export class PerpsHomePage {
  private readonly driver: Driver;

  private readonly perpsHomePage = {
    testId: 'perps-home-page',
  };

  private readonly perpsHomeBackButton = {
    testId: 'perps-home-back-button',
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
}
