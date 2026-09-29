import { tEn } from '../../../../lib/i18n-helpers';
import { Driver } from '../../../webdriver/driver';

/**
 * The Money transaction details page (`#/money-home/transaction/:id`).
 *
 * Screen: opened by clicking a Money activity row (requires the
 * `moneyEnableActivityDetails` flag).
 * Owns: page-loaded check, hero amount and status assertions, header back.
 * Boundaries: the activity list that opens this page belongs to
 * `MoneyHomePage`.
 * Related: `MoneyHomePage`.
 *
 * @see ui/pages/money/money-transaction-details-page.tsx
 */
class MoneyTransactionDetailsPage {
  private readonly backButton = {
    testId: 'money-transaction-details-back-button',
  };

  private readonly driver: Driver;

  private readonly heroAmount = {
    testId: 'money-transaction-details-hero-amount',
  };

  private readonly loadingSkeleton = {
    testId: 'money-transaction-details-loading',
  };

  private readonly page = { testId: 'money-transaction-details-page' };

  private readonly statusValue = {
    testId: 'money-transaction-details-status-value',
  };

  constructor(driver: Driver) {
    this.driver = driver;
  }

  async checkHeroAmount(amount: string): Promise<void> {
    await this.driver.waitForSelector({ ...this.heroAmount, text: amount });
  }

  async checkPageIsLoaded(): Promise<void> {
    console.log('Wait for Money transaction details page to load');
    await this.driver.assertElementNotPresent(this.loadingSkeleton);
    await this.driver.waitForMultipleSelectors([
      this.page,
      this.backButton,
      this.heroAmount,
      this.statusValue,
    ]);
  }

  async checkStatus(status: string): Promise<void> {
    await this.driver.waitForSelector({ ...this.statusValue, text: status });
  }

  async checkStatusIsConfirmed(): Promise<void> {
    await this.checkStatus(tEn('confirmed'));
  }

  async goBack(): Promise<void> {
    await this.driver.clickElement(this.backButton);
  }
}

export default MoneyTransactionDetailsPage;
