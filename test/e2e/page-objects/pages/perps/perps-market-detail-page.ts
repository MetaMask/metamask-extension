import { Driver } from '../../../webdriver/driver';

/**
 * Page object for the Perps Market Detail page (single market, order entry).
 *
 * @see ui/pages/perps/perps-market-detail-page.tsx
 */
export class PerpsMarketDetailPage {
  private readonly driver: Driver;

  private readonly addFundsCtaButton = { testId: 'perps-add-funds-cta-button' };

  private readonly amountInputField = { testId: 'amount-input-field' };

  private readonly amountInputFieldInput =
    '[data-testid="amount-input-field"] input';

  private readonly autoCloseRow = { testId: 'perps-auto-close-row' };

  private readonly closeCtaButton = { testId: 'perps-close-cta-button' };

  private readonly closePositionModal = {
    testId: 'perps-close-position-modal',
  };

  private readonly closeAmountSlider = '[data-testid="close-amount-slider"]';

  private readonly closePositionModalSubmit = {
    testId: 'perps-close-position-modal-submit',
  };

  private readonly decreaseMarginModal = {
    testId: 'perps-decrease-margin-modal',
  };

  private readonly addMarginModal = { testId: 'perps-add-margin-modal' };

  private readonly editMarginModalSave = {
    testId: 'perps-edit-margin-modal-save',
  };

  private readonly geoBlockModal = { testId: 'perps-geo-block-modal' };

  private readonly geoBlockModalDismiss = {
    testId: 'perps-geo-block-modal-dismiss',
  };

  private readonly longCtaButton = { testId: 'perps-long-cta-button' };

  private readonly marginCard = { testId: 'perps-margin-card' };

  private readonly marginMenu = { testId: 'perps-margin-menu' };

  private readonly marginMenuAdd = { testId: 'perps-margin-menu-add' };

  private readonly marginMenuRemove = { testId: 'perps-margin-menu-remove' };

  private readonly marketDetailBackButton = {
    testId: 'perps-market-detail-back-button',
  };

  private readonly marketDetailPage = { testId: 'perps-market-detail-page' };

  private readonly modifyCtaButton = { testId: 'perps-modify-cta-button' };

  private readonly modifyMenu = { testId: 'perps-modify-menu' };

  private readonly modifyMenuAddExposure = {
    testId: 'perps-modify-menu-add-exposure',
  };

  private readonly modifyMenuReduceExposure = {
    testId: 'perps-modify-menu-reduce-exposure',
  };

  private readonly modifyMenuReversePosition = {
    testId: 'perps-modify-menu-reverse-position',
  };

  private readonly orderEntry = { testId: 'order-entry' };

  private readonly positionCtaButtons = {
    testId: 'perps-position-cta-buttons',
  };

  private readonly positionLeverage = {
    testId: 'perps-position-leverage',
  };

  private readonly positionSizeValue = {
    testId: 'perps-position-size-value',
  };

  private readonly reversePositionModal = {
    testId: 'perps-reverse-position-modal',
  };

  private readonly reversePositionModalCancel = {
    testId: 'perps-reverse-position-modal-cancel',
  };

  private readonly reversePositionModalSave = {
    testId: 'perps-reverse-position-modal-save',
  };

  private readonly shortCtaButton = { testId: 'perps-short-cta-button' };

  private readonly submitOrderButton = { testId: 'submit-order-button' };

  private readonly tradeCtaButtons = { testId: 'perps-trade-cta-buttons' };

  private readonly updateTpslModal = { testId: 'perps-update-tpsl-modal' };

  private readonly updateTpslModalSubmit = {
    testId: 'perps-update-tpsl-modal-submit',
  };

  /**
   * Update TP/SL modal does not set data-testid on TP/SL TextFields; inputs appear in
   * order: TP price, TP %, SL price, SL % (see update-tpsl-modal-content.tsx).
   */
  private readonly tpslModalTpPriceInputLocator = {
    xpath: `(//*[@data-testid="perps-update-tpsl-modal"]//input[contains(@class,"mm-text-field__input")])[1]`,
  };

  private readonly tpslModalSlPriceInputLocator = {
    xpath: `(//*[@data-testid="perps-update-tpsl-modal"]//input[contains(@class,"mm-text-field__input")])[3]`,
  };

  constructor(driver: Driver) {
    this.driver = driver;
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
   * Asserts that the position size text matches the expected value.
   *
   * @param expectedText - Exact text to match (e.g. "1.25 ETH").
   */
  async checkPositionSizeValue(expectedText: string): Promise<void> {
    await this.driver.waitForSelector({
      testId: 'perps-position-size-value',
      text: expectedText,
    });
  }

  /**
   * Asserts that the direction/leverage text matches (e.g. "Long 3x").
   *
   * @param expectedText - Exact text to match (e.g. "Long 3x").
   */
  async checkPositionLeverage(expectedText: string): Promise<void> {
    await this.driver.waitForSelector({
      testId: 'perps-position-leverage',
      text: expectedText,
    });
  }

  /**
   * Asserts that the position liquidation price row contains the given text fragment
   * (e.g. "2,400" for $2,400-style formatting).
   * @param textFragment
   */
  async checkPositionLiquidationContains(textFragment: string): Promise<void> {
    await this.driver.waitForSelector({
      testId: 'perps-position-liquidation-value',
      text: textFragment,
    });
  }

  /**
   * Clicks the back control on the market detail header (navigates to wallet default route).
   */
  async clickBack(): Promise<void> {
    await this.driver.clickElement(this.marketDetailBackButton);
  }

  /**
   * Clicks the Add Funds CTA button visible when balance is zero.
   */
  async clickAddFundsCta(): Promise<void> {
    await this.driver.clickElement(this.addFundsCtaButton);
  }

  /**
   * Clicks the Close CTA button to open the close position modal.
   * Requires an open position in this market.
   */
  async clickClose(): Promise<void> {
    await this.driver.clickElement(this.closeCtaButton);
  }

  /**
   * Clicks the Long button to open the order entry for a new long position.
   */
  async clickLong(): Promise<void> {
    await this.driver.clickElement(this.longCtaButton);
  }

  /**
   * Opens the Modify dropdown menu by clicking the Modify CTA button.
   * Requires an open position in this market.
   */
  async clickModify(): Promise<void> {
    await this.driver.clickElement(this.modifyCtaButton);
    await this.driver.waitForSelector(this.modifyMenu);
  }

  /**
   * Clicks "Add Exposure" from the Modify menu.
   * Opens the order entry in add-exposure mode.
   * Requires the Modify menu to already be open (call clickModify() first).
   */
  async clickModifyMenuAddExposure(): Promise<void> {
    await this.driver.clickElement(this.modifyMenuAddExposure);
  }

  /**
   * Clicks "Reduce Exposure" from the Modify menu.
   * Opens the order entry in reduce-exposure mode.
   * Requires the Modify menu to already be open (call clickModify() first).
   */
  async clickModifyMenuReduceExposure(): Promise<void> {
    await this.driver.clickElement(this.modifyMenuReduceExposure);
  }

  /**
   * Clicks "Reverse Position" from the Modify menu.
   * Opens the reverse position confirmation modal.
   * Requires the Modify menu to already be open (call clickModify() first).
   */
  async clickModifyMenuReversePosition(): Promise<void> {
    await this.driver.clickElement(this.modifyMenuReversePosition);
  }

  /**
   * Opens the margin Add/Remove popover: clicks the margin summary card, then waits for the menu.
   */
  async clickMarginMenu(): Promise<void> {
    await this.driver.clickElement(this.marginCard);
    await this.driver.waitForSelector(this.marginMenu);
  }

  /**
   * Clicks "Add" in the margin card menu to open the Add Margin modal.
   * Requires the margin menu to already be open (call clickMarginMenu() first).
   */
  async clickMarginMenuAdd(): Promise<void> {
    await this.driver.clickElement(this.marginMenuAdd);
  }

  /**
   * Clicks "Remove" in the margin card menu to open the Decrease Margin modal.
   * Requires the margin menu to already be open (call clickMarginMenu() first).
   */
  async clickMarginMenuRemove(): Promise<void> {
    await this.driver.clickElement(this.marginMenuRemove);
  }

  /**
   * Cancels the reverse position modal without reversing.
   */
  async cancelReversePosition(): Promise<void> {
    await this.driver.clickElement(this.reversePositionModalCancel);
  }

  /**
   * Confirms and submits the reverse position modal.
   * Waits for the modal to disappear after save.
   */
  async confirmReversePosition(): Promise<void> {
    await this.driver.clickElementAndWaitToDisappear(
      this.reversePositionModalSave,
    );
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
   * Clicks the auto-close row to open the TP/SL update modal.
   * Works whether the position has no TP/SL yet (shows a CTA) or already has one.
   */
  async clickAutoCloseRow(): Promise<void> {
    await this.driver.clickElement(this.autoCloseRow);
  }

  /**
   * Fills the stop-loss price input inside the TP/SL update modal.
   * Requires waitForUpdateTpslModal() to have been called first.
   *
   * @param price - Stop loss price string (e.g. '2400').
   */
  async fillSlPriceInTpslModal(price: string): Promise<void> {
    await this.driver.fill(this.tpslModalSlPriceInputLocator, price);
  }

  /**
   * Fills the take-profit price input inside the TP/SL update modal.
   * Requires waitForUpdateTpslModal() to have been called first.
   *
   * @param price - Take profit price string (e.g. '3500').
   */
  async fillTpPriceInTpslModal(price: string): Promise<void> {
    await this.driver.fill(this.tpslModalTpPriceInputLocator, price);
  }

  /**
   * Fills the USD margin amount in the Add or Remove margin modal.
   * Requires the corresponding modal to be open (add / decrease).
   *
   * @param mode - 'add' for perps-add-margin-modal, 'remove' for perps-decrease-margin-modal.
   * @param amountUsd - Amount string without currency (e.g. '100', '250').
   */
  async fillMarginModalAmount(
    mode: 'add' | 'remove',
    amountUsd: string,
  ): Promise<void> {
    const modalTestId =
      mode === 'add' ? 'perps-add-margin-modal' : 'perps-decrease-margin-modal';
    await this.driver.waitForSelector({ testId: modalTestId });
    const amountInputCss = `[data-testid="${modalTestId}"] [data-testid="perps-edit-margin-amount-input"]`;
    await this.driver.waitForSelector(amountInputCss);
    await this.driver.fill(amountInputCss, amountUsd);
  }

  /**
   * Saves the margin edit modal (applies the margin change).
   */
  async saveMarginEdit(): Promise<void> {
    await this.driver.waitForSelector(this.editMarginModalSave);
    const saveButton = await this.driver.findElement(this.editMarginModalSave);
    await this.driver.scrollToElement(saveButton);
    await this.driver.clickElementAndWaitToDisappear(
      this.editMarginModalSave,
      20000,
    );
  }

  /**
   * Sets the close-position slider to the given percentage (0–100).
   *
   * Dispatches synthetic mouse events on the MUI Slider rail so React
   * state updates exactly as if the user had clicked on the track.
   *
   * @param percent - Target percentage (e.g. 50 for half the position).
   */
  async setClosePercent(percent: number): Promise<void> {
    await this.driver.executeScript(
      `
      const pct = arguments[0][0];
      const container = document.querySelector('${this.closeAmountSlider}');
      const thumb = container.querySelector('[role="slider"]');
      const rail = thumb.parentElement;
      const rect = rail.getBoundingClientRect();
      const x = rect.left + (rect.width * pct / 100);
      const y = rect.top + rect.height / 2;
      const opts = { clientX: x, clientY: y, bubbles: true, cancelable: true };
      rail.dispatchEvent(new MouseEvent('mousedown', opts));
      document.dispatchEvent(new MouseEvent('mouseup', opts));
      `,
      percent,
    );
    await this.driver.delay(500);
  }

  /**
   * Submits the close position modal.
   * Closes the position at the currently selected percentage (default: 100%).
   *
   * @param timeout - Optional wait timeout in ms (default 3000).
   */
  async submitClosePosition(timeout = 3000): Promise<void> {
    await this.driver.clickElementAndWaitToDisappear(
      this.closePositionModalSubmit,
      timeout,
    );
  }

  /**
   * Submits the TP/SL update modal (perps-update-tpsl-modal).
   *
   * @param timeout - Max wait for the submit control to disappear (default 20_000).
   */
  async submitTpslUpdate(timeout = 20000): Promise<void> {
    await this.driver.clickElementAndWaitToDisappear(
      this.updateTpslModalSubmit,
      timeout,
    );
  }

  /**
   * Waits until the TP/SL update modal is removed from the DOM after save or dismiss.
   * @param timeout
   */
  async waitForUpdateTpslModalClosed(timeout = 15000): Promise<void> {
    await this.driver.waitForElementNotPresent(this.updateTpslModal, timeout);
  }

  /**
   * Asserts the auto-close row body text includes a fragment (e.g. formatted fiat "3,500").
   * @param textFragment
   */
  async checkAutoCloseRowContains(textFragment: string): Promise<void> {
    const row = await this.driver.findVisibleElement(this.autoCloseRow);
    const text = await row.getText();
    if (!text.includes(textFragment)) {
      throw new Error(
        `Expected auto-close row to include "${textFragment}". Actual:\n${text}`,
      );
    }
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
   * Dismisses the geo-block modal by clicking the "Got it" button.
   */
  async dismissGeoBlockModal(): Promise<void> {
    await this.driver.clickElement(this.geoBlockModalDismiss);
  }

  /**
   * Navigates to the market detail page by clicking the market row in the Market List.
   * Requires the Perps Market List to be visible (e.g. after navigateToMarketList()).
   * Use a symbol with no existing position (e.g. AVAX) to see Long/Short buttons.
   *
   * @param symbol - Market symbol (e.g. 'AVAX', 'ETH'). Colons are replaced with dashes to match the UI testid.
   */
  async navigateToMarket(symbol: string): Promise<void> {
    const marketRowTestId = `market-row-${symbol.replaceAll(':', '-')}`;
    await this.driver.waitForSelector({ testId: marketRowTestId });
    await this.driver.clickElement({ testId: marketRowTestId });
    await this.checkPageIsLoaded();
  }

  /**
   * Waits for the Add Margin modal to be visible (margin menu → Add).
   * Also asserts the available balance value is rendered.
   */
  async waitForAddMarginModal(): Promise<void> {
    await this.driver.waitForSelector(this.addMarginModal);
  }

  /**
   * Waits for the auto-close row to be visible on the position detail.
   * Appears when the position has a TP or SL order configured.
   */
  async waitForAutoCloseRow(): Promise<void> {
    await this.driver.waitForSelector(this.autoCloseRow);
  }

  /**
   * Waits for the close position modal to be visible.
   */
  async waitForClosePositionModal(): Promise<void> {
    await this.driver.waitForSelector(this.closePositionModal);
  }

  /**
   * Waits for the Decrease Margin modal to be visible (margin menu → Remove).
   */
  async waitForDecreaseMarginModal(): Promise<void> {
    await this.driver.waitForSelector(this.decreaseMarginModal);
  }

  /**
   * Waits until the Add / Remove margin modal is fully removed from the DOM.
   * Prefer this over a fixed sleep after save so the mock WS push runs after the UI closed.
   *
   * @param mode - Which modal variant was open.
   * @param timeout - Max wait in ms (default 15_000).
   */
  async waitForEditMarginModalClosed(
    mode: 'add' | 'remove',
    timeout = 15000,
  ): Promise<void> {
    const modalTestId =
      mode === 'add' ? 'perps-add-margin-modal' : 'perps-decrease-margin-modal';
    await this.driver.waitForElementNotPresent(
      { testId: modalTestId },
      timeout,
    );
  }

  /**
   * Waits until the reverse-position confirmation modal is removed from the DOM.
   *
   * @param timeout - Max wait in ms (default 15_000).
   */
  async waitForReversePositionModalClosed(timeout = 15000): Promise<void> {
    await this.driver.waitForElementNotPresent(
      this.reversePositionModal,
      timeout,
    );
  }

  /**
   * Waits for the geo-block modal to be visible on the market detail page.
   * Appears when an ineligible user attempts Long/Short or Close actions.
   */
  async waitForGeoBlockModal(): Promise<void> {
    await this.driver.waitForSelector(this.geoBlockModal);
  }

  /**
   * Waits for the order entry form to be visible.
   */
  async waitForOrderEntry(): Promise<void> {
    await this.driver.waitForSelector(this.orderEntry);
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
   * Waits for the reverse position modal to be visible.
   */
  async waitForReversePositionModal(): Promise<void> {
    await this.driver.waitForSelector(this.reversePositionModal);
  }

  /**
   * Waits for the Long/Short trade buttons (visible when user has no position in this market).
   */
  async waitForTradeCtaButtons(): Promise<void> {
    await this.driver.waitForSelector(this.longCtaButton);
    await this.driver.waitForSelector(this.shortCtaButton);
  }

  /**
   * Waits for the TP/SL update modal to be visible.
   * Triggered by clicking on the auto-close row of an existing position.
   */
  async waitForUpdateTpslModal(): Promise<void> {
    await this.driver.waitForSelector(this.updateTpslModal);
  }

  /**
   * Waits for the estimated TP PnL row to be visible inside the TP/SL update modal.
   * Confirms the modal content is fully rendered with live price data.
   */
  async waitForTpslModalEstimatedTpPnlRow(): Promise<void> {
    await this.driver.waitForSelector({
      testId: 'perps-update-tpsl-estimated-tp-pnl-row',
    });
  }

  /**
   * Waits for the close position modal summary rows (fees + receive) to be visible.
   * Call after waitForClosePositionModal() to verify the modal is fully rendered.
   */
  async waitForCloseSummaryRows(): Promise<void> {
    await this.driver.waitForMultipleSelectors([
      { testId: 'perps-close-summary-fees-value' },
      { testId: 'perps-close-summary-receive-value' },
    ]);
  }

  /**
   * Waits for the reverse position modal summary rows (est size + fee) to be visible.
   * Call after waitForReversePositionModal() to verify the modal content is loaded.
   */
  async waitForReversePositionSummaryRows(): Promise<void> {
    await this.driver.waitForMultipleSelectors([
      { testId: 'perps-reverse-est-size-value' },
      { testId: 'perps-reverse-fee-value' },
    ]);
  }

  /**
   * Waits for the margin modal available balance row to be visible.
   * Call after waitForAddMarginModal() or waitForDecreaseMarginModal().
   */
  async waitForMarginModalAvailableBalance(): Promise<void> {
    await this.driver.waitForSelector({
      testId: 'perps-edit-margin-available-value',
    });
  }
}
