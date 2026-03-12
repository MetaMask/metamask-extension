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

  private readonly marketDetailBackButton = {
    testId: 'perps-market-detail-back-button',
  };

  private readonly modifyCtaButton = { testId: 'perps-modify-cta-button' };

  private readonly orderEntry = { testId: 'order-entry' };

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
   */
  async checkCloseButtonVisible(): Promise<void> {
    await this.driver.waitForSelector(this.closeCtaButton);
  }

  /**
   * Asserts that the Modify button is visible.
   * Requires an open position in this market.
   */
  async checkModifyButtonVisible(): Promise<void> {
    await this.driver.waitForSelector(this.modifyCtaButton);
  }

  /**
   * Asserts that the position CTA buttons (Modify/Close) are visible.
   * Call after placing an order to verify the position was opened.
   */
  async checkPositionCtaButtonsVisible(): Promise<void> {
    await this.waitForPositionCtaButtons();
  }

  /**
   * Clicks the Long button to open the order entry for a new long position.
   */
  async clickLong(): Promise<void> {
    await this.driver.clickElement(this.longCtaButton);
  }

  /**
   * Clicks a balance preset button by percentage (e.g. 25, 50, 75, 100).
   *
   * @param percentage - The preset percentage (e.g. 25 for 25%).
   */
  async clickPercentPreset(percentage: number): Promise<void> {
    await this.driver.clickElement({
      testId: `percent-preset-${percentage}`,
    });
  }

  /**
   * Clicks the Short button to open the order entry for a new short position.
   */
  async clickShort(): Promise<void> {
    await this.driver.clickElement(this.shortCtaButton);
  }

  /**
   * Clicks the Submit order button and waits for it to disappear (e.g. modal closes).
   * Optional custom timeout for slow environments.
   *
   * @param timeout - Optional wait timeout in ms (default 3000).
   */
  async clickSubmitOrder(timeout = 3000): Promise<void> {
    await this.driver.clickElementAndWaitToDisappear(
      this.submitOrderButton,
      timeout,
    );
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
   * Uses window.location.hash so the SPA router switches view without a full page reload,
   * which keeps the extension context and avoids re-injecting the extension.
   * Use a symbol with no existing position (e.g. AVAX) to see Long/Short buttons.
   *
   * @param symbol - Market symbol (e.g. 'AVAX', 'ETH').
   */
  async navigateToMarket(symbol: string): Promise<void> {
    const encoded = encodeURIComponent(symbol);
    await this.driver.executeScript(
      `window.location.hash = '${PERPS_MARKET_DETAIL_ROUTE}/${encoded}';`,
    );
    await this.checkPageIsLoaded();
  }

  /**
   * Waits for the order entry form to be visible.
   */
  async waitForOrderEntry(): Promise<void> {
    await this.driver.waitForSelector(this.orderEntry);
  }

  /**
   * Waits for the market detail page to be loaded.
   * Uses multiple selectors for robustness (convention).
   */
  async checkPageIsLoaded(): Promise<void> {
    await this.driver.waitForMultipleSelectors([
      this.marketDetailBackButton,
      this.marketDetailPage,
    ]);
  }

  /**
   * Waits for the Modify/Close buttons (visible when user has an open position in this market).
   * Use after placing an order to confirm the position was opened and the stream updated.
   * Fails the test if the buttons do not appear within the timeout.
   */
  async waitForPositionCtaButtons(): Promise<void> {
    await this.driver.waitForSelector(this.positionCtaButtons);
  }

  /**
   * Waits for the Long/Short trade buttons (visible when user has no position in this market).
   */
  async waitForTradeCtaButtons(): Promise<void> {
    await this.driver.waitForSelector(this.tradeCtaButtons);
  }
}
