import { Driver } from '../../../webdriver/driver';

/**
 * Page object for the Perps Activity page (full history).
 *
 * @see ui/pages/perps/perps-activity-page.tsx
 */
export class PerpsActivityPage {
  private readonly driver: Driver;

  private readonly activityPage = { testId: 'perps-activity-page' };

  constructor(driver: Driver) {
    this.driver = driver;
  }

  /**
   * Waits for the Perps Activity page to be loaded.
   */
  async checkPageIsLoaded(): Promise<void> {
    await this.driver.waitForSelector(this.activityPage);
  }
}
