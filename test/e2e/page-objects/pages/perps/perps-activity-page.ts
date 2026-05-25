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

  private readonly anyTransactionCard = {
    xpath:
      "//*[@data-testid='perps-activity-page']//*[starts-with(@data-testid,'transaction-card-')]",
  };

  private readonly filterButton = { testId: 'perps-activity-filter-button' };

  private readonly activityFilterOption = (
    type: 'trade' | 'order' | 'funding' | 'deposit',
  ) => {
    return {
      xpath: `//*[@data-testid='perps-activity-filter-option-${type}']`,
    };
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
    await this.driver.waitForSelector(this.anyTransactionCard);
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

  /**
   * Opens the activity filter dropdown by clicking the filter button.
   */
  async clickFilterButton(): Promise<void> {
    await this.driver.clickElement(this.filterButton);
  }

  /**
   * Selects a filter option from the open dropdown.
   * Call `clickFilterButton()` first to open the dropdown.
   *
   * @param type - Filter type: 'trade' | 'order' | 'funding' | 'deposit'.
   */
  async selectFilter(
    type: 'trade' | 'order' | 'funding' | 'deposit',
  ): Promise<void> {
    await this.driver.clickElement(this.activityFilterOption(type));
  }

  /**
   * Waits for a specific filter option to be visible inside the open dropdown.
   *
   * @param type - Filter type: 'trade' | 'order' | 'funding' | 'deposit'.
   */
  async waitForFilterOption(
    type: 'trade' | 'order' | 'funding' | 'deposit',
  ): Promise<void> {
    await this.driver.waitForSelector(this.activityFilterOption(type));
  }

  /**
   * Clicks the first visible transaction card on the activity page.
   * Use after ensuring at least one transaction card is visible.
   */
  async clickFirstTransactionCard(): Promise<void> {
    await this.driver.clickElement(this.anyTransactionCard);
  }
}
