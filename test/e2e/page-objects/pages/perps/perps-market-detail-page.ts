import { Key } from 'selenium-webdriver';
import { Driver } from '../../../webdriver/driver';

/**
 * Page object for the Perps Market Detail page (single market, order entry).
 *
 * @see ui/pages/perps/perps-market-detail-page.tsx
 */
export class PerpsMarketDetailPage {
  private readonly driver: Driver;

  /**
   * `CloseAmountSection` slider wrapper. Full `data-testid` is
   * `{closeAmountSliderPctTestIdPrefix}{0-100}`.
   *
   * @see ui/components/app/perps/order-entry/components/close-amount-section/close-amount-section.tsx
   */
  private static readonly closeAmountSliderPctTestIdPrefix =
    'close-amount-slider-pct-';

  private static readonly perpsClosePositionModalTestId =
    'perps-close-position-modal';

  private readonly addFundsCtaButton = { testId: 'perps-add-funds-cta-button' };

  private readonly addMarginModal = { testId: 'perps-add-margin-modal' };

  private readonly amountInputField = { testId: 'amount-input-field' };

  private readonly amountInputFieldInput =
    '[data-testid="amount-input-field"] input';

  private readonly autoCloseRow = { testId: 'perps-auto-close-row' };

  /**
   * Close-amount slider wrapper in the open close-position modal only (avoids
   * targeting any other `CloseAmountSection` in the document).
   */
  private readonly closeAmountSliderInCloseModal = `[data-testid="${PerpsMarketDetailPage.perpsClosePositionModalTestId}"] [data-testid^="${PerpsMarketDetailPage.closeAmountSliderPctTestIdPrefix}"]`;

  /**
   * MUI `Slider` thumb / track (`role="slider"`) inside the close modal.
   * Keyboard handling matches @material-ui/core/Slider (End = max, ArrowLeft = step down in LTR).
   */
  private readonly closeAmountSliderRoleInCloseModal = `${this.closeAmountSliderInCloseModal} [role="slider"]`;

  private readonly closeCtaButton = { testId: 'perps-close-cta-button' };

  private readonly closePositionModal = {
    testId: 'perps-close-position-modal',
  };

  private readonly closePositionModalSubmit = {
    testId: 'perps-close-position-modal-submit',
  };

  private readonly closeSummaryFeesValue = {
    testId: 'perps-close-summary-fees-value',
  };

  private readonly closeSummaryReceiveValue = {
    testId: 'perps-close-summary-receive-value',
  };

  private readonly marginAmountInput =
    '[data-testid="perps-edit-margin-amount-input"] input';

  private readonly decreaseMarginModal = {
    testId: 'perps-decrease-margin-modal',
  };

  private readonly editMarginAvailableValue = {
    testId: 'perps-edit-margin-available-value',
  };

  private readonly editMarginModalSave = {
    testId: 'perps-edit-margin-modal-save',
  };

  private readonly favoriteButton = {
    testId: 'perps-market-detail-favorite-button',
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

  /**
   * Perps toast (`dataTestId` default `perps-toast` → `perps-toast-banner-base`).
   * Dismissing avoids `ElementClickInterceptedError` on CTAs in Firefox when the
   * banner overlays the action row.
   *
   * @see ui/components/multichain/toast/toast.tsx
   * @see ui/components/app/perps/perps-toast/perps-toast-provider.tsx
   */
  private readonly perpsToastCloseButton =
    '[data-testid="perps-toast-banner-base"] .mm-banner-base__close-button';

  private readonly positionCtaButtons = {
    testId: 'perps-position-cta-buttons',
  };

  private readonly positionLeverage = {
    testId: 'perps-position-leverage',
  };

  private readonly positionLiquidationValue = {
    testId: 'perps-position-liquidation-value',
  };

  private readonly positionSizeValue = {
    testId: 'perps-position-size-value',
  };

  private readonly reverseEstSizeValue = {
    testId: 'perps-reverse-est-size-value',
  };

  private readonly reverseFeeValue = {
    testId: 'perps-reverse-fee-value',
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

  private readonly tpslEstimatedTpPnlRow = {
    testId: 'perps-update-tpsl-estimated-tp-pnl-row',
  };

  /**
   * Update TP/SL modal does not set data-testid on TP/SL TextFields; inputs appear in
   * order: TP price, TP %, SL price, SL % (see update-tpsl-modal-content.tsx).
   */
  private readonly tpslModalSlPriceInputLocator = {
    xpath: `(//*[@data-testid="perps-update-tpsl-modal"]//input[contains(@class,"mm-text-field__input")])[3]`,
  };

  private readonly tpslModalTpPriceInputLocator = {
    xpath: `(//*[@data-testid="perps-update-tpsl-modal"]//input[contains(@class,"mm-text-field__input")])[1]`,
  };

  private readonly updateTpslModal = { testId: 'perps-update-tpsl-modal' };

  private readonly updateTpslModalSubmit = {
    testId: 'perps-update-tpsl-modal-submit',
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
      ...this.positionSizeValue,
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
      ...this.positionLeverage,
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
      ...this.positionLiquidationValue,
      text: textFragment,
    });
  }

  /**
   * Dismisses the perps toast if it is open (e.g. success toast after a fill).
   * No-op if the toast is absent (uses {@link Driver.clickElementSafe}).
   */
  async dismissPerpsToastIfPresent(): Promise<void> {
    await this.driver.clickElementSafe(this.perpsToastCloseButton, 2000);
  }

  /**
   * Clicks the back control on the market detail header (navigates to wallet default route).
   *
   * The market detail page has a `useEffect` that calls `navigate(currentPath, { replace: true })`
   * to clean up toast route-state. This effect can fire during the `navigate(-1)` transition,
   * cancelling the back navigation and requiring a second click. We retry once if the page
   * is still visible after the first click.
   */
  async clickBack(): Promise<void> {
    await this.driver.clickElementAndWaitToDisappear(
      this.marketDetailBackButton,
    );
  }

  /**
   * Clicks the favourite (star) button to toggle watchlist for this market.
   * The button is always visible in the market detail header.
   */
  async clickFavoriteButton(): Promise<void> {
    await this.driver.clickElement(this.favoriteButton);
  }

  /**
   * Waits for the favorite (star) button to reach the given state.
   * Pass `'favorited'` for aria-label "Remove from favorites",
   * `'unfavorited'` for "Add to favorites", or omit to wait for any state.
   *
   * @param state - Target button state, or undefined for any state.
   */
  async waitForFavoriteButton(
    state?: 'favorited' | 'unfavorited',
  ): Promise<void> {
    if (state === undefined) {
      await this.driver.waitForSelector(this.favoriteButton);
      return;
    }
    const ariaLabel =
      state === 'favorited' ? 'Remove from favorites' : 'Add to favorites';
    await this.driver.waitForSelector({
      xpath: `//*[@data-testid='perps-market-detail-favorite-button'][@aria-label='${ariaLabel}']`,
    });
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
   * Dismisses a visible perps success toast first so the click is not obscured (Firefox).
   */
  async clickClose(): Promise<void> {
    await this.dismissPerpsToastIfPresent();
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
   *
   * Dismisses any visible toast and scrolls the card to the viewport centre
   * so that sticky CTA buttons at the bottom cannot intercept the click.
   */
  async clickMarginMenu(): Promise<void> {
    await this.dismissPerpsToastIfPresent();
    await this.driver.findScrollToAndClickElement(this.marginCard);
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
   *
   * Dismisses any visible toast and scrolls the row to the viewport centre
   * so that sticky CTA buttons at the bottom cannot intercept the click.
   */
  async clickAutoCloseRow(): Promise<void> {
    await this.dismissPerpsToastIfPresent();
    await this.driver.findScrollToAndClickElement(this.autoCloseRow);
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
    const modal =
      mode === 'add' ? this.addMarginModal : this.decreaseMarginModal;
    await this.driver.waitForSelector(modal);
    await this.driver.fill(this.marginAmountInput, amountUsd);
  }

  /**
   * Saves the margin edit modal (applies the margin change).
   */
  async saveMarginEdit(): Promise<void> {
    await this.driver.clickElementAndWaitToDisappear(
      this.editMarginModalSave,
      20000,
    );
  }

  /**
   * Reads the close % from the wrapper `data-testid` inside the open close modal.
   */
  private async getCloseAmountSliderPercentInModal(): Promise<number> {
    const el = await this.driver.waitForSelector(
      this.closeAmountSliderInCloseModal,
    );
    const testId = await el.getAttribute('data-testid');
    const match = testId?.match(
      new RegExp(
        `^${PerpsMarketDetailPage.closeAmountSliderPctTestIdPrefix}(\\d+)$`,
        'u',
      ),
    );
    if (!match) {
      throw new Error(
        `Unexpected close-amount slider data-testid: ${String(testId)}`,
      );
    }
    return parseInt(match[1], 10);
  }

  /**
   * Sets the close-position slider to the given percentage (0–100) in the close modal.
   *
   * Uses the MUI Slider keyboard model: `End` jumps to `max` (100), then `ArrowLeft`
   * steps by 1 (see `handleKeyDown` in @material-ui/core/Slider/Slider.js). This
   * avoids hit-testing / coordinate issues with WebDriver in the extension.
   *
   * @param percent - Target 0–100; must match `close-amount-slider-pct-{n}` on the wrapper.
   */
  async setClosePercent(percent: number): Promise<void> {
    if (percent < 0 || percent > 100) {
      throw new Error(`setClosePercent: ${percent} out of range 0–100`);
    }
    await this.driver.waitForSelector(this.closeAmountSliderInCloseModal);
    const handleCss = this.closeAmountSliderRoleInCloseModal;
    await this.driver.clickElement(handleCss);
    await this.driver.press(handleCss, Key.END);
    await this.driver.wait(
      async () => (await this.getCloseAmountSliderPercentInModal()) === 100,
      8000,
    );
    for (let k = 0; k < 100 - percent; k += 1) {
      await this.driver.press(handleCss, Key.ARROW_LEFT);
    }
    await this.driver.wait(
      async () => (await this.getCloseAmountSliderPercentInModal()) === percent,
      10000,
    );
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
    await this.driver.assertElementNotPresent(this.updateTpslModal, {
      timeout,
    });
  }

  /**
   * Waits until the auto-close row body text includes a fragment (e.g. formatted fiat "3,500").
   * @param textFragment
   */
  async checkAutoCloseRowContains(textFragment: string): Promise<void> {
    await this.driver.waitForSelector({
      xpath: `//*[@data-testid="perps-auto-close-row"][contains(normalize-space(.), "${textFragment}")]`,
    });
  }

  /**
   * Types an amount in the amount input (USD).
   * Targets the actual input inside the amount field so fill works.
   *
   * @param amount
   */
  async fillAmount(amount: string): Promise<void> {
    await this.driver.waitForSelector(this.amountInputField);
    await this.driver.fill(this.amountInputFieldInput, amount);
  }

  /**
   * Dismisses the geo-block modal by clicking the "Got it" button.
   */
  async dismissGeoBlockModal(): Promise<void> {
    await this.driver.clickElementAndWaitToDisappear(this.geoBlockModalDismiss);
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
    const modal =
      mode === 'add' ? this.addMarginModal : this.decreaseMarginModal;
    await this.driver.assertElementNotPresent(modal, { timeout });
  }

  /**
   * Waits until the reverse-position confirmation modal is removed from the DOM.
   *
   * @param timeout - Max wait in ms (default 15_000).
   */
  async waitForReversePositionModalClosed(timeout = 15000): Promise<void> {
    await this.driver.assertElementNotPresent(this.reversePositionModal, {
      timeout,
    });
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
    await this.driver.waitForSelector(this.tpslEstimatedTpPnlRow);
  }

  /**
   * Waits for the close position modal summary rows (fees + receive) to be visible.
   * Call after waitForClosePositionModal() to verify the modal is fully rendered.
   */
  async waitForCloseSummaryRows(): Promise<void> {
    await this.driver.waitForMultipleSelectors([
      this.closeSummaryFeesValue,
      this.closeSummaryReceiveValue,
    ]);
  }

  /**
   * Waits for the reverse position modal summary rows (est size + fee) to be visible.
   * Call after waitForReversePositionModal() to verify the modal content is loaded.
   */
  async waitForReversePositionSummaryRows(): Promise<void> {
    await this.driver.waitForMultipleSelectors([
      this.reverseEstSizeValue,
      this.reverseFeeValue,
    ]);
  }

  /**
   * Waits for the margin modal available balance row to be visible.
   * Call after waitForAddMarginModal() or waitForDecreaseMarginModal().
   */
  async waitForMarginModalAvailableBalance(): Promise<void> {
    await this.driver.waitForSelector(this.editMarginAvailableValue);
  }

  /**
   * High-level helper: waits for the close position modal, verifies summary rows,
   * optionally adjusts the close percentage, then submits.
   * Use when the modal is already open (e.g. after clickModifyMenuReduceExposure()).
   *
   * @param percent - Close percentage 0–100 (default 100). Pass less than 100 for a partial close.
   */
  async confirmCloseModal(percent = 100): Promise<void> {
    await this.waitForClosePositionModal();
    await this.waitForCloseSummaryRows();
    if (percent < 100) {
      await this.setClosePercent(percent);
    }
    await this.submitClosePosition();
  }

  /**
   * High-level helper: clicks Close then confirms the close position modal.
   * Dismisses any visible perps toast first (handled by clickClose).
   *
   * @param percent - Close percentage 0–100 (default 100). Pass less than 100 for a partial close.
   */
  async closePosition(percent = 100): Promise<void> {
    await this.clickClose();
    await this.confirmCloseModal(percent);
  }

  /**
   * High-level helper: opens the TP/SL update modal, fills the take-profit price, and saves.
   *
   * @param price - Take profit price string (e.g. '3500.00').
   */
  async setTakeProfit(price: string): Promise<void> {
    await this.clickAutoCloseRow();
    await this.waitForUpdateTpslModal();
    await this.fillTpPriceInTpslModal(price);
    await this.submitTpslUpdate();
    await this.waitForUpdateTpslModalClosed();
  }

  /**
   * High-level helper: opens the TP/SL update modal, fills the stop-loss price, and saves.
   *
   * @param price - Stop loss price string (e.g. '2400.00').
   */
  async setStopLoss(price: string): Promise<void> {
    await this.clickAutoCloseRow();
    await this.waitForUpdateTpslModal();
    await this.fillSlPriceInTpslModal(price);
    await this.submitTpslUpdate();
    await this.waitForUpdateTpslModalClosed();
  }
}
