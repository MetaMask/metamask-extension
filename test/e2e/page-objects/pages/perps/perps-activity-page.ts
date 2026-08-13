import { Driver } from '../../../webdriver/driver';

/**
 * The Perps Activity page: full trade / order / funding / deposit history.
 *
 * Screen: `#/perps/activity`, reached from `PerpsTab.clickRecentActivitySeeAll`.
 * Owns: the activity page shell, filter button and type options, transaction
 * cards, waiting for trade-title fragments, and the header back control.
 * Boundaries: the activity list only. Opening a card may leave this screen;
 * asserting Perps home or market detail after back belongs to those objects.
 * Related: `PerpsTab` (how tests get here),
 * `flows/perps-activity-close-fill.flow.ts` for close-fill assertions that
 * span market detail and activity.
 *
 * @see ui/pages/perps/perps-activity-page.tsx
 */
export class PerpsActivityPage {
  private readonly activityBackButton = {
    testId: 'perps-activity-back-button',
  };

  private readonly activityFilterOption = (
    type: 'trade' | 'order' | 'funding' | 'deposit',
  ) => {
    return {
      xpath: `//*[@data-testid='perps-activity-filter-option-${type}']`,
    };
  };

  private readonly activityPage = { testId: 'perps-activity-page' };

  private readonly anyTransactionCard = {
    xpath:
      "//*[@data-testid='perps-activity-page']//*[starts-with(@data-testid,'transaction-card-')]",
  };

  private readonly driver: Driver;

  private readonly filterButton = { testId: 'perps-activity-filter-button' };

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
   * Opens the activity filter dropdown by clicking the filter button.
   */
  async clickFilterButton(): Promise<void> {
    await this.driver.clickElement(this.filterButton);
  }

  /**
   * Clicks the first visible transaction card on the activity page.
   * Use after ensuring at least one transaction card is visible.
   */
  async clickFirstTransactionCard(): Promise<void> {
    await this.driver.clickElement(this.anyTransactionCard);
  }

  /**
   * Header back control (`navigate(-1)` in the app — typically returns to Perps home).
   */
  async clickHeaderBack(): Promise<void> {
    await this.driver.clickElement(this.activityBackButton);
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
   * Waits until at least one trade row (transaction card) is visible on Activity.
   * Requires a fill-derived trade (e.g. after a `userFills` snapshot push in E2E).
   */
  async waitForAnyTransactionCard(): Promise<void> {
    await this.driver.waitForSelector(this.anyTransactionCard);
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
}
