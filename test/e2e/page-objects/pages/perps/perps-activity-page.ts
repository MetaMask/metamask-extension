import { Driver } from '../../../webdriver/driver';

/**
 * Page object for the Perps Activity page (full history).
 *
 * @see ui/pages/perps/perps-activity-page.tsx
 */
export class PerpsActivityPage {
  private readonly driver: Driver;

  private readonly activityPage = { testId: 'perps-activity-page' };

  private readonly activityBackButton = {
    testId: 'perps-activity-back-button',
  };

  constructor(driver: Driver) {
    this.driver = driver;
  }

  /**
   * Waits for the Perps Activity page to be loaded.
   */
  async checkPageIsLoaded(): Promise<void> {
    await this.driver.waitForSelector(this.activityPage);
  }

  /**
   * Header back control (`navigate(-1)` in the app — typically returns to Perps home).
   */
  async clickHeaderBack(): Promise<void> {
    await this.driver.clickElement(this.activityBackButton);
  }

  /**
   * Waits until at least one trade row (transaction card) is visible on Activity.
   * Requires a fill-derived trade (e.g. after a `userFills` snapshot push in E2E).
   */
  async waitForAnyTransactionCard(): Promise<void> {
    await this.driver.waitForSelector({
      xpath:
        "//*[@data-testid='perps-activity-page']//*[starts-with(@data-testid,'transaction-card-')]",
    });
  }

  /**
   * Waits for a trade row title fragment (e.g. `"Closed long"`, `"Closed short"`)
   * as produced by `transformFillsToTransactions`.
   * @param fragment
   */
  async waitForActivityTradeTitleContaining(fragment: string): Promise<void> {
    await this.driver.waitForSelector({
      xpath: `//*[@data-testid='perps-activity-page']//*[contains(normalize-space(.), "${fragment}")]`,
    });
  }
}
