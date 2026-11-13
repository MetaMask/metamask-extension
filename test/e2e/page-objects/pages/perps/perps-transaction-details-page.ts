import { Driver } from '../../../webdriver/driver';

/**
 * The Perps Transaction Details page: one order, trade (fill) or funding
 * payment.
 *
 * Screen: `#/perps/transaction-details`, reached from
 * `PerpsActivityPage.clickFirstTransactionCard`. The transaction comes from
 * router state, so the page redirects to `#/perps/activity` when opened
 * directly.
 * Owns: the details page shell and header back control.
 * Boundaries: the details page only. Deposits and withdrawals open the generic
 * transaction details instead; the activity list belongs to
 * `PerpsActivityPage`.
 * Related: `PerpsActivityPage` (how tests get here).
 *
 * @see ui/pages/perps/perps-transaction-details-page.tsx
 */
export class PerpsTransactionDetailsPage {
  private readonly backButton = {
    testId: 'perps-transaction-details-back-button',
  };

  private readonly driver: Driver;

  private readonly parentSelector = {
    testId: 'perps-transaction-details-page',
  };

  constructor(driver: Driver) {
    this.driver = driver;
  }

  /**
   * Waits for the Perps Transaction Details page to be loaded.
   * Checks for the page root and the header back button.
   */
  async checkPageIsLoaded(): Promise<void> {
    await this.driver.waitForMultipleSelectors([
      this.parentSelector,
      this.backButton,
    ]);
  }
}
