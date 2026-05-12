import { Driver } from '../../../webdriver/driver';

/**
 * Page object for the Perps Withdraw page.
 * Accessible from the Perps Home balance dropdown → Withdraw.
 *
 * @see ui/pages/perps/perps-withdraw-page.tsx
 */
export class PerpsWithdrawPage {
  private readonly driver: Driver;

  private readonly amountInput = '[data-testid="perps-fiat-hero-amount-input"]';

  private readonly backButton = { testId: 'perps-withdraw-back-button' };

  private readonly cancelButton = { testId: 'perps-withdraw-cancel' };

  private readonly headerTitle = { testId: 'perps-withdraw-header-title' };

  private readonly submitButton = { testId: 'perps-withdraw-submit' };

  private readonly summaryAssetRow = { testId: 'perps-withdraw-summary-asset' };

  private readonly summaryFeeRow = { testId: 'perps-withdraw-summary-fee' };

  private readonly summaryReceiveRow = {
    testId: 'perps-withdraw-summary-receive',
  };

  private readonly summaryTimeRow = { testId: 'perps-withdraw-summary-time' };

  private readonly withdrawPage = { testId: 'perps-withdraw-page' };

  private readonly withdrawPageChildren =
    '[data-testid="perps-withdraw-page"] *';

  private readonly withdrawToast = { testId: 'perps-withdraw-toast' };

  constructor(driver: Driver) {
    this.driver = driver;
  }

  /**
   * Waits for the Perps Withdraw page to be fully loaded.
   * Checks for the page root and the header title.
   */
  async checkPageIsLoaded(): Promise<void> {
    await this.driver.waitForMultipleSelectors([
      this.withdrawPage,
      this.headerTitle,
    ]);
  }

  /**
   * Clicks the Back (arrow) button to return to the previous page.
   */
  async clickBack(): Promise<void> {
    await this.driver.clickElement(this.backButton);
  }

  /**
   * Clicks the Cancel button and navigates back to the home route.
   */
  async clickCancel(): Promise<void> {
    await this.driver.clickElement(this.cancelButton);
  }

  /**
   * Fills the hero amount input with the given amount string (e.g. '100').
   * Clears the field first to avoid appending to the default '0'.
   *
   * @param amount - Amount string to enter (e.g. '100', '5.50').
   */
  async fillAmount(amount: string): Promise<void> {
    await this.driver.waitForSelector(this.amountInput);
    await this.driver.fill(this.amountInput, amount);
  }

  /**
   * Asserts that the submit (Withdraw) button is disabled.
   * Used to verify validation prevents submission of invalid amounts.
   */
  async assertSubmitDisabled(): Promise<void> {
    await this.driver.waitForSelector(this.submitButton, { state: 'disabled' });
  }

  /**
   * Waits for a validation error message containing the given text to be visible.
   *
   * @param message - Substring of the expected validation message.
   */
  async waitForValidationMessage(message: string): Promise<void> {
    await this.driver.waitForSelector({
      css: this.withdrawPageChildren,
      text: message,
    });
  }

  /**
   * Waits for all four summary rows (receive, fee, time, you receive) to be visible.
   */
  async waitForSummaryRows(): Promise<void> {
    await this.driver.waitForMultipleSelectors([
      this.summaryAssetRow,
      this.summaryFeeRow,
      this.summaryTimeRow,
      this.summaryReceiveRow,
    ]);
  }

  /**
   * Clicks the primary Withdraw submit button once it is enabled (valid amount).
   */
  async clickSubmit(): Promise<void> {
    await this.driver.clickElement(this.submitButton);
  }

  /**
   * Waits for the post-success toast on wallet home (`PerpsWithdrawToast`).
   */
  async waitForWithdrawSubmittedToast(): Promise<void> {
    await this.driver.waitForSelector({
      ...this.withdrawToast,
      text: 'Withdrawal submitted',
    });
  }
}
