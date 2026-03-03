import { Driver } from '../../../webdriver/driver';
import { PERPS_MARKET_DETAIL_ROUTE } from '../../../tests/perps/helpers';

/**
 * Page object for the Perps Market Detail page (single market, order entry).
 *
 * @see ui/pages/perps/perps-market-detail-page.tsx
 */
export class PerpsMarketDetailPage {
  private readonly driver: Driver;

  private readonly marketDetailPage = { testId: 'perps-market-detail-page' };

  private readonly tradeCtaButtons = { testId: 'perps-trade-cta-buttons' };

  private readonly positionCtaButtons = {
    testId: 'perps-position-cta-buttons',
  };

  private readonly longCtaButton = { testId: 'perps-long-cta-button' };

  private readonly shortCtaButton = { testId: 'perps-short-cta-button' };

  private readonly submitOrderButton = { testId: 'submit-order-button' };

  private readonly orderEntry = { testId: 'order-entry' };

  /** Container for amount (testId is on TextField wrapper). */
  private readonly amountInputField = { testId: 'amount-input-field' };

  /** Actual input element to fill (inside the TextField wrapper). */
  private readonly amountInputFieldInput =
    '[data-testid="amount-input-field"] input';

  private readonly percentPreset25 = { testId: 'percent-preset-25' };

  constructor(driver: Driver) {
    this.driver = driver;
  }

  /**
   * Navigates to the market detail page for the given symbol.
   * Use a symbol with no existing position (e.g. AVAX) to see Long/Short buttons.
   * @param symbol
   */
  async navigateToMarket(symbol: string): Promise<void> {
    const encoded = encodeURIComponent(symbol);
    await this.driver.executeScript(
      `window.location.hash = '${PERPS_MARKET_DETAIL_ROUTE}/${encoded}';`,
    );
    await this.waitForPageLoaded();
  }

  /**
   * Waits for the market detail page to be loaded.
   */
  async waitForPageLoaded(): Promise<void> {
    await this.driver.waitForSelector(this.marketDetailPage);
  }

  /**
   * Waits for the Long/Short trade buttons (visible when user has no position in this market).
   * @param timeout
   */
  async waitForTradeCtaButtons(timeout?: number): Promise<void> {
    await this.driver.waitForSelector(this.tradeCtaButtons, { timeout });
  }

  /**
   * Waits for the Modify/Close buttons (visible when user has an open position in this market).
   * Use after placing an order to confirm the position was opened and the stream updated.
   * Fails the test if the buttons do not appear within the timeout.
   * @param timeout
   */
  async waitForPositionCtaButtons(timeout?: number): Promise<void> {
    await this.driver.waitForSelector(this.positionCtaButtons, { timeout });
  }

  /**
   * Asserts that the position CTA buttons (Modify/Close) are visible.
   * Call after placing an order to verify the position was opened.
   * @param timeout
   */
  async checkPositionCtaButtonsVisible(timeout?: number): Promise<void> {
    await this.waitForPositionCtaButtons(timeout);
  }

  /**
   * Asserts that the Modify button is visible (same as Close: only checks the button).
   * Requires an open position in this market.
   * @param timeout
   */
  async checkModifyButtonVisible(timeout?: number): Promise<void> {
    await this.driver.waitForSelector(
      { testId: 'perps-modify-cta-button' },
      { timeout },
    );
  }

  /**
   * Asserts that the Close button is visible (only checks the button).
   * Requires an open position in this market.
   * @param timeout
   */
  async checkCloseButtonVisible(timeout?: number): Promise<void> {
    await this.driver.waitForSelector(
      { testId: 'perps-close-cta-button' },
      { timeout },
    );
  }

  /**
   * Clicks the Long button to open the order entry for a new long position.
   */
  async clickLong(): Promise<void> {
    await this.driver.clickElement(this.longCtaButton);
  }

  /**
   * Clicks the Short button to open the order entry for a new short position.
   */
  async clickShort(): Promise<void> {
    await this.driver.clickElement(this.shortCtaButton);
  }

  /**
   * Waits for the order entry form to be visible.
   */
  async waitForOrderEntry(): Promise<void> {
    await this.driver.waitForSelector(this.orderEntry);
  }

  /**
   * Clicks the 25% balance preset to set order amount.
   */
  async clickPercentPreset25(): Promise<void> {
    await this.driver.clickElement(this.percentPreset25);
  }

  /**
   * Types an amount in the amount input (USD).
   * Targets the actual input inside the amount field so fill works.
   * @param amount
   */
  async fillAmount(amount: string): Promise<void> {
    await this.driver.waitForSelector(this.amountInputField);
    const inputElement = await this.driver.findElement(
      this.amountInputFieldInput,
    );
    await this.driver.scrollToElement(inputElement);
    await this.driver.fill(this.amountInputFieldInput, amount);
  }

  /**
   * Clicks the Submit order button.
   * clickElement uses findClickableElement and waits for the button to be visible and enabled.
   */
  async clickSubmitOrder(): Promise<void> {
    await this.driver.clickElement(this.submitOrderButton);
  }

  /**
   * Waits for the submit button to be present (order form visible).
   */
  async waitForSubmitButton(): Promise<void> {
    await this.driver.waitForSelector(this.submitOrderButton);
  }

  /**
   * Waits for the submit button to be enabled (form valid and ready to submit).
   * Use after filling amount to avoid clicking while the button is still disabled.
   * @param timeout
   */
  async waitForSubmitButtonEnabled(timeout?: number): Promise<void> {
    await this.driver.waitForSelector(this.submitOrderButton, {
      state: 'enabled',
      timeout,
    });
  }

  /**
   * Waits for the order form to close after submit (submit button removed from DOM).
   * The UI switches to detail view when the position appears in the stream or after a fallback timeout.
   * Use after clickSubmitOrder() to know when submission finished and we left the order view.
   * @param timeout
   */
  async waitForOrderFormClosed(timeout?: number): Promise<void> {
    await this.driver.waitForSelector(this.submitOrderButton, {
      state: 'detached',
      timeout,
    });
  }
}
