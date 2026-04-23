import { Driver } from '../../../webdriver/driver';

/**
 * Page object for the Perps Order Entry page.
 * Accessible after clicking Long/Short on a market detail page.
 * Handles new orders, add-exposure, and reduce-exposure flows.
 *
 * @see ui/pages/perps/perps-order-entry-page.tsx
 * @see ui/components/app/perps/order-entry/order-entry.tsx
 */
export class PerpsOrderEntryPage {
  private readonly driver: Driver;

  private readonly amountInputField = { testId: 'amount-input-field' };

  private readonly amountInputFieldInput =
    '[data-testid="amount-input-field"] input';

  private readonly autoCloseToggle = '[data-testid="auto-close-toggle"] input';

  private readonly backButton = { testId: 'perps-order-entry-back-button' };

  private readonly directionTabLong = { testId: 'direction-tab-long' };

  private readonly directionTabShort = { testId: 'direction-tab-short' };

  private readonly leverageInput = '[data-testid="leverage-input"] input';

  private readonly limitPriceInput = '[data-testid="limit-price-input"] input';

  private readonly orderEntryPage = { testId: 'perps-order-entry-page' };

  private readonly orderSubmitError = { testId: 'perps-order-submit-error' };

  private readonly orderTypeLimitButton = { testId: 'order-type-limit' };

  private readonly orderTypeMarketButton = { testId: 'order-type-market' };

  private readonly slPriceInput = '[data-testid="sl-price-input"] input';

  private readonly slValidationError = { testId: 'sl-validation-error' };

  private readonly submitOrderButton = { testId: 'submit-order-button' };

  private readonly tpPriceInput = '[data-testid="tp-price-input"] input';

  private readonly tpValidationError = { testId: 'tp-validation-error' };

  constructor(driver: Driver) {
    this.driver = driver;
  }

  /**
   * Waits for the order entry page to be fully loaded.
   */
  async checkPageIsLoaded(): Promise<void> {
    await this.driver.waitForSelector(this.orderEntryPage);
  }

  /**
   * Clicks the Back button to return to the market detail page.
   */
  async clickBack(): Promise<void> {
    await this.driver.clickElement(this.backButton);
  }

  /**
   * Enables the auto-close (TP/SL) section by toggling the auto-close toggle.
   * The TP and SL price inputs are only visible when auto-close is enabled.
   */
  async enableAutoClose(): Promise<void> {
    await this.driver.waitForSelector({ css: this.autoCloseToggle });
    await this.driver.clickElement({ css: this.autoCloseToggle });
  }

  /**
   * Types an amount in the USD amount input.
   * Clears the field first to avoid appending to the current value.
   *
   * @param amount - USD amount string (e.g. '100', '500').
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
   * Types a leverage multiplier value into the leverage input.
   *
   * @param leverage - Leverage string (e.g. '5', '10').
   */
  async fillLeverage(leverage: string): Promise<void> {
    await this.driver.fill(this.leverageInput, leverage);
  }

  /**
   * Types a limit price into the limit price input.
   * Requires limit order type to be selected first (selectOrderTypeLimit()).
   *
   * @param price - Limit price string (e.g. '2800').
   */
  async fillLimitPrice(price: string): Promise<void> {
    await this.driver.fill(this.limitPriceInput, price);
  }

  /**
   * Types a stop-loss price into the SL price input.
   * Requires auto-close to be enabled first (enableAutoClose()).
   *
   * @param price - Stop loss price string (e.g. '2500').
   */
  async fillSlPrice(price: string): Promise<void> {
    await this.driver.fill(this.slPriceInput, price);
  }

  /**
   * Types a take-profit price into the TP price input.
   * Requires auto-close to be enabled first (enableAutoClose()).
   *
   * @param price - Take profit price string (e.g. '3200').
   */
  async fillTpPrice(price: string): Promise<void> {
    await this.driver.fill(this.tpPriceInput, price);
  }

  /**
   * Switches to the Long direction tab (visible when the order entry supports direction change).
   */
  async selectDirectionLong(): Promise<void> {
    await this.driver.clickElement(this.directionTabLong);
  }

  /**
   * Switches to the Short direction tab.
   */
  async selectDirectionShort(): Promise<void> {
    await this.driver.clickElement(this.directionTabShort);
  }

  /**
   * Switches to Limit order type.
   * Enables the limit price input field.
   */
  async selectOrderTypeLimit(): Promise<void> {
    await this.driver.clickElement(this.orderTypeLimitButton);
  }

  /**
   * Switches to Market order type (default).
   */
  async selectOrderTypeMarket(): Promise<void> {
    await this.driver.clickElement(this.orderTypeMarketButton);
  }

  /**
   * Clicks the Submit button on the order entry page and waits for it to disappear.
   *
   * @param timeout - Optional wait timeout in ms (default 3000).
   */
  async submitOrder(timeout = 3000): Promise<void> {
    await this.driver.clickElementAndWaitToDisappear(
      this.submitOrderButton,
      timeout,
    );
  }

  /**
   * Waits for the order submit error message to be visible.
   * Appears when the order cannot be placed (e.g. insufficient balance).
   */
  async waitForOrderSubmitError(): Promise<void> {
    await this.driver.waitForSelector(this.orderSubmitError);
  }

  /**
   * Waits for the SL validation error to be visible.
   * Appears when the stop-loss price is in the wrong direction for the trade.
   */
  async waitForSlValidationError(): Promise<void> {
    await this.driver.waitForSelector(this.slValidationError);
  }

  /**
   * Waits for the TP validation error to be visible.
   * Appears when the take-profit price is in the wrong direction for the trade.
   */
  async waitForTpValidationError(): Promise<void> {
    await this.driver.waitForSelector(this.tpValidationError);
  }
}
