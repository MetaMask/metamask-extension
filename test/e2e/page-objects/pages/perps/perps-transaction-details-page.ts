import { Driver } from '../../../webdriver/driver';

/**
 * Page object for the Perps transaction details page (single order, trade,
 * or funding payment).
 *
 * @see ui/pages/perps/perps-transaction-details-page.tsx
 */
export class PerpsTransactionDetailsPage {
  private readonly driver: Driver;

  private readonly transactionDetailsPage = {
    testId: 'perps-transaction-details-page',
  };

  private readonly backButton = {
    testId: 'perps-transaction-details-back-button',
  };

  constructor(driver: Driver) {
    this.driver = driver;
  }

  /**
   * Waits for the Perps transaction details page to be loaded.
   */
  async checkPageIsLoaded(): Promise<void> {
    await this.driver.waitForMultipleSelectors([
      this.backButton,
      this.transactionDetailsPage,
    ]);
  }
}
