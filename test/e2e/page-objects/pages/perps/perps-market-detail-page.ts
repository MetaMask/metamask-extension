import { Driver } from '../../../webdriver/driver';
import { PERPS_MARKET_DETAIL_ROUTE } from '../../../tests/perps/helpers';

/**
 * Page object for the Perps Market Detail page (single market, order entry).
 *
 * @see ui/pages/perps/perps-market-detail-page.tsx
 */
export class PerpsMarketDetailPage {
  private readonly driver: Driver;

  private readonly amountInputField = { testId: 'amount-input-field' };

  private readonly amountInputFieldInput =
    '[data-testid="amount-input-field"] input';

  private readonly closeCtaButton = { testId: 'perps-close-cta-button' };

  private readonly longCtaButton = { testId: 'perps-long-cta-button' };

  private readonly marketDetailPage = { testId: 'perps-market-detail-page' };

  private readonly modifyCtaButton = { testId: 'perps-modify-cta-button' };

  private readonly orderEntry = { testId: 'order-entry' };

  private readonly percentPreset25 = { testId: 'percent-preset-25' };

  private readonly positionCtaButtons = {
    testId: 'perps-position-cta-buttons',
  };

  private readonly shortCtaButton = { testId: 'perps-short-cta-button' };

  private readonly submitOrderButton = { testId: 'submit-order-button' };

  private readonly tradeCtaButtons = { testId: 'perps-trade-cta-buttons' };

  constructor(driver: Driver) {
    this.driver = driver;
  }

  /**
   * Asserts that the Close button is visible.
   * Requires an open position in this market.
   *
   * @param timeout
   */
  async checkCloseButtonVisible(timeout?: number): Promise<void> {
    await this.driver.waitForSelector(this.closeCtaButton, { timeout });
  }

  /**
   * Asserts that the Modify button is visible.
   * Requires an open position in this market.
   *
   * @param timeout
   */
  async checkModifyButtonVisible(timeout?: number): Promise<void> {
    await this.driver.waitForSelector(this.modifyCtaButton, { timeout });
  }

  /**
   * Asserts that the position CTA buttons (Modify/Close) are visible.
   * Call after placing an order to verify the position was opened.
   *
   * @param timeout
   */
  async checkPositionCtaButtonsVisible(timeout?: number): Promise<void> {
    await this.waitForPositionCtaButtons(timeout);
  }

  /**
   * Clicks the Long button to open the order entry for a new long position.
   */
  async clickLong(): Promise<void> {
    await this.driver.clickElement(this.longCtaButton);
  }

  /**
   * Clicks the 25% balance preset to set order amount.
   */
  async clickPercentPreset25(): Promise<void> {
    await this.driver.clickElement(this.percentPreset25);
  }

  /**
   * Clicks the Short button to open the order entry for a new short position.
   */
  async clickShort(): Promise<void> {
    await this.driver.clickElement(this.shortCtaButton);
  }

  /**
   * Clicks the Submit order button.
   * clickElement uses findClickableElement and waits for the button to be visible and enabled.
   */
  async clickSubmitOrder(): Promise<void> {
    await this.driver.clickElement(this.submitOrderButton);
  }

  /**
   * Types an amount in the amount input (USD).
   * Targets the actual input inside the amount field so fill works.
   *
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
   * Navigates to the market detail page for the given symbol.
   * Uses window.location.hash for SPA navigation without a full page reload.
   * Use a symbol with no existing position (e.g. AVAX) to see Long/Short buttons.
   *
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
   * Waits for the order entry form to be visible.
   */
  async waitForOrderEntry(): Promise<void> {
    await this.driver.waitForSelector(this.orderEntry);
  }

  /**
   * Waits for the market detail page to be loaded.
   */
  async waitForPageLoaded(): Promise<void> {
    await this.driver.waitForSelector(this.marketDetailPage);
  }

  /**
   * Waits for the Modify/Close buttons (visible when user has an open position in this market).
   * Use after placing an order to confirm the position was opened and the stream updated.
   * Fails the test if the buttons do not appear within the timeout.
   *
   * @param timeout
   */
  async waitForPositionCtaButtons(timeout?: number): Promise<void> {
    await this.driver.waitForSelector(this.positionCtaButtons, { timeout });
  }

  /**
   * Waits for the submit button to be present (order form visible).
   */
  async waitForSubmitButton(): Promise<void> {
    await this.driver.waitForSelector(this.submitOrderButton);
  }

  /**
   * Waits for the Long/Short trade buttons (visible when user has no position in this market).
   *
   * @param timeout
   */
  async waitForTradeCtaButtons(timeout?: number): Promise<void> {
    await this.driver.waitForSelector(this.tradeCtaButtons, { timeout });
  }
}
