import { strict as assert } from 'assert';
import { Key } from 'selenium-webdriver';
import { Driver } from '../../../webdriver/driver';

/**
 * The prepare page debounces quote parameter updates by 300ms before sending
 * them to the bridge controller, so anything longer than that is enough for a
 * pending update to be delivered.
 */
const QUOTE_PARAMS_DEBOUNCE_MS = 500;

/** Prefix the Select quote dialog renders before each quote's cost. */
const TOTAL_COST_LABEL = 'Total cost:';

/** Which of the Swap screen's two asset pickers to open. */
export type AssetPickerSide = 'source' | 'destination';

export type SwapReviewOptions = {
  exchangeRate?: string;
  swapFrom: string;
  swapTo: string;
  swapToAmount: string;
  swapFromAmount: string;
  skipCounter?: boolean;
};

export type SwapQuote = {
  totalCost: string;
  receivedAmount: string;
  receivedAmountInCurrency?: string;
  provider?: string;
};

/**
 * The Swap screen, where users swap on the same chain or across chains
 * (bridge): source/destination assets, amount, quotes and submit.
 *
 * Screen: `#/cross-chain/swaps/prepare-bridge-page`.
 * Owns: the source/destination asset picker buttons and the tokens they show,
 * amount entry (including Max), quote fetch/ready checks, quote review, the
 * Select quote dialog, fee and price-impact messaging, insufficient-funds /
 * no-quotes / geo-block states, slippage controls and their warning banner,
 * and the bridge CTA / snap confirm footer used after submit.
 * Boundaries: the prepare and quote surface. The asset picker
 * (`#/cross-chain/swaps/prepare-bridge-page/assets`) is `SwapAssetPickerPage`.
 * Post-submit redesigned confirmations and activity belong elsewhere.
 * Related: `flows/bridge.flow.ts` for selecting tokens through the asset
 * picker and end-to-end bridge journeys, `flows/swap.flow.ts` for building a
 * swap quote from the home page.
 *
 * @see ui/pages/bridge/index.tsx
 * @see ui/pages/bridge/prepare/prepare-bridge-page.tsx
 * @see test/e2e/page-objects/flows/bridge.flow.ts
 * @see test/e2e/page-objects/pages/swap/swap-asset-picker-page.ts
 */
class SwapPage {
  private backButton = '[aria-label="Back"]';

  private closeButton = '[aria-label="Close"]';

  private closeQuotesButton = 'header button';

  private confirmButton =
    '[data-testid="confirm-sign-and-send-transaction-confirm-snap-footer-button"]';

  private destinationAmount = (amount: string) =>
    `[data-testid="to-amount"][value="${amount}"]`;

  private destinationAmountInput = '[data-testid="to-amount"]';

  private destinationAssetPickerButton =
    '[data-testid="bridge-destination-button"]';

  protected driver: Driver;

  private fetchingQuotesLabel = {
    tag: 'p',
    text: 'Fetching quotes...',
  };

  private gasIncludedIndicator = '[data-testid="network-fees-included"]';

  private gasSponsoredIndicator = '[data-testid="network-fees-sponsored"]';

  private insufficientFundsButton = {
    text: 'Insufficient funds',
    css: '[data-testid="bridge-cta-button"]',
  };

  private maxButton = { text: 'Max' };

  private minimumReceived = '[data-testid="minimum-received"]';

  private moreETHneededForGas = '[data-testid="bridge-insufficient-gas"]';

  private moreQuotesButton = '[aria-label="More quotes"]';

  private networkFees = '[data-testid="network-fees"]';

  private networkFeesValue = {
    css: this.networkFees,
    text: '$',
  };

  private noOptionAvailable = '[data-testid="bridge-no-quotes"]';

  private readonly parentSelector = {
    testId: 'parent-selector-bridge-quote',
  };

  private priceImpactQuoteCardButton =
    '[data-testid="price-impact-warning-button"]';

  private quoteOption = '.bridge-quote-option';

  private quotesModal = '[data-testid="quotes-modal"]';

  private quotesModalBackButton =
    '[data-testid="quotes-modal"] [aria-label="Back"]';

  private quotesModalTitle = {
    css: this.quotesModal,
    text: 'Select quote',
  };

  private quoteTotalCost = (position: number) =>
    `${this.quotesModal} ${this.quoteOption}:nth-child(${position}) [data-testid="bridge-quote-total-cost"]`;

  private rateMessage = {
    text: 'Includes 0.875% MetaMask fee',
    tag: 'p',
  };

  private rwaGeoRestrictedMessage = {
    css: '[data-testid="bridge-no-quotes"]',
    text: "This swap isn't available in your region.",
  };

  private slippageCustomButton =
    '[data-testid="bridge__tx-settings-modal-custom-button"]';

  private slippageCustomInput =
    'input[data-testid="bridge__tx-settings-modal-custom-input"]';

  private slippageEditButton = '[data-testid="slippage-edit-button"]';

  private slippageSubmitButton =
    '[data-testid="bridge__tx-settings-modal-submit-button"]';

  private sourceAmount = '[data-testid="from-amount"]';

  private sourceAssetPickerButton = '[data-testid="bridge-source-button"]';

  private submitButton = '[data-testid="bridge-cta-button"]';

  private swapButton = {
    css: this.submitButton,
    text: 'Swap',
  };

  private swapsBannerTitle = '[data-testid="swaps-banner-title"]';

  private switchTokensButton = '[data-testid="switch-tokens"]';

  private tokenWarningAlert =
    '[data-testid="bridge-banner-alerts"] > [data-testid^="bridge-"]';

  private warningModal = '[data-testid="bridge-alert-modal"]';

  private warningModalCancelButton =
    '[data-testid="bridge-alert-modal-cancel-button"]';

  private warningModalProceedButton =
    '[data-testid="bridge-alert-modal-proceed-button"]';

  constructor(driver: Driver) {
    this.driver = driver;
  }

  approveModal = async () => {
    await this.driver.clickElement(this.warningModalProceedButton);
  };

  approveModalIfPresent = async () => {
    try {
      // Wait for an *enabled* proceed button. Using :not([disabled]) means:
      // - No modal present           → no match → 3 s timeout → catch (no-op)
      // - Modal open, tx in-flight   → button has [disabled] attr → no match
      //                              → 3 s timeout → catch (no-op)
      // - Modal open, tx not yet submitted → button is enabled → match → click
      await this.driver.waitForSelector(
        `${this.warningModalProceedButton}:not([disabled])`,
      );
      await this.driver.clickElement(this.warningModalProceedButton);
    } catch {
      // No confirmation modal with an enabled proceed button — nothing to do
    }
  };

  /**
   * Checks the Total cost of every row of the Select quote dialog, in display
   * order.
   *
   * @param expectedTotalCosts - Total cost values as rendered, cheapest first.
   */
  async checkAllQuoteTotalCosts(expectedTotalCosts: string[]): Promise<void> {
    for (const [index, expectedTotalCost] of expectedTotalCosts.entries()) {
      await this.checkSingleQuoteTotalCost(index + 1, expectedTotalCost);
    }
  }

  checkAssetsAreSelected = async (sourceToken: string, destToken: string) => {
    await this.driver.waitForSelector({
      css: this.sourceAssetPickerButton,
      text: sourceToken,
    });
    console.log(`Expected source asset ${sourceToken} is selected`);
    await this.driver.waitForSelector({
      css: this.destinationAssetPickerButton,
      text: destToken,
    });
    console.log(`Expected dest asset ${destToken} is selected`);
  };

  async checkCustomSlippageDisplayedValue(value: string): Promise<void> {
    await this.driver.waitForSelector({
      css: this.slippageCustomButton,
      text: `${value}%`,
    });
  }

  async checkDestAmount(amount: string) {
    await this.driver.waitForSelector(this.destinationAmount(amount));
  }

  async checkDestinationToken(token: string): Promise<void> {
    await this.driver.waitForSelector({
      css: this.destinationAssetPickerButton,
      text: token,
    });
  }

  async checkExpectedNetworkFeeIsDisplayed(): Promise<void> {
    // The fee element renders empty until the quote's native exchange rate
    // lands, so wait for the formatted amount rather than for the element.
    await this.driver.waitForSelector(this.networkFeesValue);
    console.log('Network fee is displayed');
  }

  async checkExpectedNetworkFeeIsNotDisplayed(): Promise<void> {
    await this.driver.assertElementNotPresent(this.networkFees, {
      waitAtLeastGuard: 1000,
    });
    console.log('Network fee is not displayed');
  }

  async checkGasIncludedIsDisplayed(): Promise<void> {
    try {
      await this.driver.waitForSelector(this.gasIncludedIndicator);
    } catch (e) {
      console.log('Expected "Gas fees included" indicator is not present');
      throw e;
    }
    console.log('Gas fees included indicator is displayed');
  }

  async checkGasSponsoredIsDisplayed(): Promise<void> {
    try {
      await this.driver.waitForSelector(this.gasSponsoredIndicator);
    } catch (e) {
      console.log('Expected "Gas fees sponsored" indicator is not present');
      throw e;
    }
    console.log('Gas fees sponsored indicator is displayed');
  }

  async checkInsufficientFundsButtonIsDisplayed(): Promise<void> {
    await this.driver.waitForSelector(this.insufficientFundsButton);
    await this.driver.waitForSelector(this.submitButton, {
      state: 'disabled',
    });
    console.log('The disabled button "Insufficient funds" is displayed');
  }

  async checkMoreETHneededIsDisplayed(): Promise<void> {
    try {
      await this.driver.waitForSelector(this.moreETHneededForGas);
    } catch (e) {
      console.log(
        `Expected message that "More ETH needed for gas" is not present`,
      );
      throw e;
    }
    console.log('The message "More ETH needed for gas" is displayed');
  }

  /**
   * Checks the slippage warning banner shown in the transaction settings
   * modal.
   *
   * @param title - Banner title, such as `Low slippage`.
   * @param text - Banner description text.
   */
  async checkNotificationBanner(title: string, text: string): Promise<void> {
    await this.driver.waitForSelector({
      css: this.swapsBannerTitle,
      text: title,
    });
    // Banners built on `@metamask/design-system-react`'s `BannerAlert` no
    // longer render the legacy `.mm-banner-base` class, so match the
    // description text directly instead of scoping to that class.
    await this.driver.waitForSelector({ text });
  }

  async checkNoTradeRouteMessageIsDisplayed(): Promise<void> {
    try {
      await this.driver.waitForSelector(this.noOptionAvailable);
    } catch (e) {
      console.log(
        `Expected message that "no trade route is available" is not present`,
      );
      throw e;
    }
    console.log('The message "no trade route is available" is displayed');
  }

  /**
   * Checks that the swap page is loaded.
   *
   * @param timeout - Optional timeout in milliseconds. Defaults to 10000.
   */
  async checkPageIsLoaded(timeout: number = 10000): Promise<void> {
    try {
      await this.driver.waitForMultipleSelectors(
        [
          this.parentSelector,
          this.sourceAmount,
          this.destinationAssetPickerButton,
        ],
        { timeout },
      );
    } catch (e) {
      console.log('Timeout while waiting for swap page to be loaded', e);
      throw e;
    }
    console.log('Swap page is loaded');
  }

  checkPriceImpactModalIsDisplayed = async () => {
    await this.driver.clickElement(this.priceImpactQuoteCardButton);
    await this.driver.waitForSelector(this.warningModal);
    await this.driver.clickElementAndWaitToDisappear(
      this.warningModalCancelButton,
    );
  };

  async checkQuote(quote: SwapQuote): Promise<void> {
    await this.driver.waitForSelector({
      text: `Total cost: ${quote.totalCost}`,
      tag: 'p',
    });
    await this.driver.waitForSelector({
      text: `${quote.receivedAmount}`,
      tag: 'p',
    });
    await this.driver.waitForSelector({
      text: quote.receivedAmountInCurrency,
      tag: 'p',
    });
    await this.driver.waitForSelector({
      text: quote.provider,
      tag: 'p',
    });
  }

  async checkQuoteIsDisplayed(options?: { timeout?: number }): Promise<void> {
    await this.driver.waitForMultipleSelectors(
      [this.networkFees, this.slippageEditButton, this.minimumReceived],
      options,
    );
  }

  async checkQuoteIsDisplayedWithoutNetworkFee(options?: {
    timeout?: number;
  }): Promise<void> {
    await this.driver.waitForMultipleSelectors(
      [
        this.slippageEditButton,
        this.minimumReceived,
        this.destinationAmountInput,
      ],
      options,
    );
  }

  /**
   * Opens the Select quote dialog from More quotes and asserts the Total cost
   * of every quote, then closes the dialog with Back so the quote selected on
   * the quote page is left unchanged.
   *
   * @param expectedTotalCosts - Total cost values as rendered, cheapest first,
   * e.g. `['$38.95']` or `['0.0143 ETH']`. Derive them from the mocked quotes
   * with `getExpectedQuoteTotalCosts` rather than writing amounts by hand.
   */
  async checkQuoteTotalCost(expectedTotalCosts: string[]): Promise<void> {
    await this.driver.clickElement(this.moreQuotesButton);
    await this.driver.waitForSelector(this.quotesModalTitle);

    await this.waitForExpectedNumberOfQuotes(expectedTotalCosts.length);

    // Checking each value at its own position also covers the cheapest-first
    // sorting.
    await this.checkAllQuoteTotalCosts(expectedTotalCosts);

    await this.driver.waitForSelector({
      css: `${this.quotesModal} ${this.quoteOption}:first-child`,
      text: 'Lowest cost',
    });

    await this.driver.clickElementAndWaitToDisappear(
      this.quotesModalBackButton,
    );
    console.log(
      `Quote total costs are as expected: ${expectedTotalCosts.join(', ')}`,
    );
  }

  async checkRwaGeoRestrictedMessageIsDisplayed(): Promise<void> {
    try {
      await this.driver.waitForSelector(this.rwaGeoRestrictedMessage);
    } catch (e) {
      console.log(
        `Expected message that "This swap isn't available in your region" is not present`,
      );
      throw e;
    }
    console.log('The RWA geo-restricted message is displayed');
  }

  /**
   * Checks the Total cost of one row of the Select quote dialog, as rendered:
   * either a fiat amount (`$2.26`) or, when the quote has no fiat cost, the
   * native network fee (`0.0143 ETH`).
   *
   * @param position - 1-based position of the quote in the dialog.
   * @param expectedTotalCost - Total cost value as rendered, without the label.
   */
  async checkSingleQuoteTotalCost(
    position: number,
    expectedTotalCost: string,
  ): Promise<void> {
    await this.driver.waitForSelector({
      css: this.quoteTotalCost(position),
      text: `${TOTAL_COST_LABEL} ${expectedTotalCost}`,
    });
  }

  async checkSourceToken(token: string): Promise<void> {
    await this.driver.waitForSelector({
      css: this.sourceAssetPickerButton,
      text: token,
    });
  }

  /**
   * Waits for the from/to amount fields to be populated. Throws if the
   * amounts are still empty once the wait times out.
   */
  async checkSwapAmountsArePopulated(): Promise<void> {
    await this.driver.wait(async () => {
      const fromAmount = await this.getFromAmountValue();
      const toAmount = await this.getToAmountValue();
      return fromAmount !== '' && toAmount !== '';
    }, this.driver.timeout);
  }

  /**
   * Asserts the destination-token security banner is shown (malicious or suspicious).
   * The banner title is localized with the token symbol (e.g. "MUSD is a malicious token."),
   * so we scope by data-testid and match a stable substring of the title.
   *
   * @param titleSubstring - Text that must appear in the banner (title is token-specific).
   * @param descriptionSubstring - When provided, text that must also appear in the same banner.
   */
  async checkTokenRiskWarningIsDisplayed(
    titleSubstring: string,
    descriptionSubstring?: string,
  ): Promise<void> {
    await this.driver.waitForSelector(
      {
        testId: 'bridge-token-security',
        text: titleSubstring,
      },
      { timeout: 30000 },
    );
    if (descriptionSubstring) {
      await this.driver.waitForSelector({
        testId: 'bridge-token-security',
        text: descriptionSubstring,
      });
    }
  }

  async clickMaxButton(): Promise<void> {
    await this.driver.waitForSelector(this.maxButton);
    await this.driver.clickElement(this.maxButton);
    console.log('Clicked Max button');
  }

  async clickOnMoreQuotes(): Promise<void> {
    await this.driver.clickElement(this.moreQuotesButton);
  }

  closeModal = async () => {
    await this.driver.clickElement(this.closeButton);
  };

  async closeQuotes(): Promise<void> {
    await this.driver.clickElementAndWaitToDisappear(this.closeQuotesButton);
  }

  confirmBridgeTransaction = async () => {
    await this.driver.clickElement(this.confirmButton);
  };

  dismissTokenAlert = async (expectedNumberOfAlerts?: number) => {
    await this.closeModal();
    if (expectedNumberOfAlerts) {
      await this.driver.elementCountBecomesN(
        this.tokenWarningAlert,
        expectedNumberOfAlerts,
      );
    }
  };

  /**
   * Pastes the source amount and waits until quotes are no longer being
   * fetched.
   *
   * @param amount - The source amount.
   */
  async enterBridgeAmount(amount: string): Promise<void> {
    // This controlled input filters keyboard events. Paste through its
    // dedicated handler so decimal values update bridge state reliably.
    await this.driver.pasteIntoField(this.sourceAmount, amount);
    await this.driver.assertElementNotPresent(this.fetchingQuotesLabel, {
      waitAtLeastGuard: 500,
    });
  }

  async enterSwapAmount(amount: string): Promise<void> {
    console.log('Entering swap amount');
    await this.driver.waitForSelector(this.sourceAmount);
    await this.driver.fill(this.sourceAmount, amount);
  }

  private async getFromAmountValue(): Promise<string> {
    const element = await this.driver.waitForSelector(this.sourceAmount);
    return element.getAttribute('value');
  }

  /**
   * Waits until the source amount input holds a stable non-empty value.
   * Use this after Max, which writes the balance asynchronously.
   *
   * @returns The source amount input value.
   */
  async getSourceAmount(): Promise<string> {
    console.log('Reading swap source amount');
    let stableValue = '';
    let stableReads = 0;
    await this.driver.waitUntil(
      async () => {
        const input = await this.driver.findElement(this.sourceAmount);
        const value = await input.getAttribute('value');
        if (!value) {
          stableValue = '';
          stableReads = 0;
          return false;
        }
        if (value === stableValue) {
          stableReads += 1;
        } else {
          stableValue = value;
          stableReads = 1;
        }
        return stableReads >= 2;
      },
      { interval: 200, timeout: 15000 },
    );
    console.log(`Swap source amount is ${stableValue}`);
    return stableValue;
  }

  private async getToAmountValue(): Promise<string> {
    const element = await this.driver.waitForSelector(
      this.destinationAmountInput,
    );
    return element.getAttribute('value');
  }

  goBack = async () => {
    await this.driver.waitForSelector(this.backButton);
    await this.driver.clickElement(this.backButton);
  };

  /**
   * Waits for the submitted swap to clear the amount, then leaves Swaps.
   */
  goBackAfterSubmit = async () => {
    await this.driver.waitForSelector(`${this.sourceAmount}[value=""]`);
    await this.goBack();
  };

  /**
   * Returns whether the source asset picker button already shows the token.
   *
   * @param token - Token symbol, such as ETH or MON.
   */
  async isSourceTokenSelected(token: string): Promise<boolean> {
    const sourceButton = await this.driver.findElement(
      this.sourceAssetPickerButton,
    );
    const label = await sourceButton.getText();
    return label.includes(token);
  }

  /**
   * Opens the source or destination asset picker.
   *
   * @param side - Which asset picker to open.
   * @param options - Options.
   * @param options.waitForQuoteParamsDebounce - Gives the prepare page time to
   * send its pending quote parameter update first. Only needed by tests that
   * assert on `Input Changed` metrics events: the picker is a separate route,
   * so opening it unmounts the prepare page and cancels that debounced update,
   * folding the input changes made before it into a later event.
   */
  async openAssetPicker(
    side: AssetPickerSide,
    { waitForQuoteParamsDebounce = false } = {},
  ): Promise<void> {
    console.log(`Opening ${side} asset picker`);
    const pickerButton =
      side === 'source'
        ? this.sourceAssetPickerButton
        : this.destinationAssetPickerButton;
    if (waitForQuoteParamsDebounce) {
      await this.driver.delay(QUOTE_PARAMS_DEBOUNCE_MS);
    }
    await this.driver.clickElement(pickerButton);
  }

  rejectModal = async () => {
    await this.driver.clickElement(this.warningModalCancelButton);
  };

  /**
   * Checks the from/to amounts, the exchange rate, the MetaMask fee and More
   * quotes, then submits the swap.
   *
   * @param options - The expected swap review values.
   */
  async reviewQuote(options: SwapReviewOptions): Promise<void> {
    await this.driver.waitForSelector(this.submitButton);
    const fromAmount = await this.driver.findElement(this.sourceAmount);
    const fromAmountText = await fromAmount.getAttribute('value');
    assert.equal(fromAmountText, options.swapFromAmount);
    const toAmount = await this.driver.findElement(this.destinationAmountInput);
    const toAmountText = await toAmount.getAttribute('value');
    assert.equal(toAmountText, options.swapToAmount);
    await this.driver.waitForSelector({
      text: `1 ${options.swapFrom} = ${
        options.exchangeRate ?? options.swapToAmount
      } ${options.swapTo}`,
      tag: 'p',
    });
    await this.driver.waitForSelector(this.rateMessage);
    await this.driver.waitForSelector(this.moreQuotesButton);

    await this.driver.clickElementAndWaitToDisappear(this.submitButton);
  }

  async setCustomSlippage(value: string): Promise<void> {
    await this.driver.clickElement(this.slippageEditButton);
    await this.driver.clickElement(this.slippageCustomButton);
    const input = await this.driver.waitForSelector(this.slippageCustomInput);
    await input.sendKeys(Key.BACK_SPACE);
    await this.driver.fill(this.slippageCustomInput, value);
    await input.sendKeys(Key.TAB);
  }

  submitQuote = async () => {
    await this.driver.clickElement(this.submitButton);
  };

  submitQuoteAndDismiss = async () => {
    await this.submitQuote();

    // If no price data is available a confirmation modal appears before submission.
    // Dismiss it so the transaction can proceed.
    await this.approveModalIfPresent();
  };

  submitQuoteWithWarning = async (warningCount: number = 0) => {
    if (warningCount) {
      await this.driver.elementCountBecomesN(
        this.tokenWarningAlert,
        warningCount,
      );
    }
    await this.submitQuote();
    await this.driver.waitForSelector(this.warningModal);
  };

  async submitSlippageModal(): Promise<void> {
    await this.driver.clickElement(this.slippageSubmitButton);
  }

  async submitSwap(): Promise<void> {
    console.log('Submit Swap');
    await this.driver.clickElementAndWaitToDisappear(this.swapButton);
  }

  async switchTokens(): Promise<void> {
    await this.driver.clickElement(this.switchTokensButton);
  }

  /**
   * Checks that a quote is shown for the expected tokens and amount, with a
   * destination amount above zero.
   *
   * @param options - The expected swap.
   * @param options.swapFrom - Source token symbol.
   * @param options.swapTo - Destination token symbol.
   * @param options.amount - Source amount.
   */
  async verifyQuote(options: {
    swapFrom: string;
    swapTo: string;
    amount: number;
  }): Promise<void> {
    await this.checkQuoteIsDisplayed();
    await this.checkSourceToken(options.swapFrom);
    await this.checkDestinationToken(options.swapTo);

    const swapFromAmount = await this.getFromAmountValue();
    assert.equal(swapFromAmount, options.amount.toString());

    const swapToAmount = await this.getToAmountValue();
    const normalizedSwapToAmount = Number(swapToAmount.replace(/,/gu, ''));
    assert.equal(
      normalizedSwapToAmount > 0,
      true,
      `Expected destination amount to be > 0 but got ${swapToAmount}`,
    );
  }

  /**
   * Waits for the Select quote dialog to list every quote. Quotes are streamed,
   * so the list keeps growing and re-sorting until the last one lands.
   *
   * @param expectedQuoteCount - Number of quotes the mocks return.
   */
  async waitForExpectedNumberOfQuotes(
    expectedQuoteCount: number,
  ): Promise<void> {
    const hasAllQuotes = await this.driver.elementCountBecomesN(
      `${this.quotesModal} ${this.quoteOption}`,
      expectedQuoteCount,
    );
    assert.ok(
      hasAllQuotes,
      `Select quote dialog did not list ${expectedQuoteCount} quotes`,
    );
  }

  waitForQuote = async () => {
    await this.driver.waitForSelector(this.submitButton);
  };

  /**
   * Waits for a same-chain swap quote: the Swap button is shown and stays
   * visible. Stricter than `waitForQuote`, which only waits for the CTA.
   */
  async waitForSwapQuote(): Promise<void> {
    console.log('Wait for swap quote to be displayed');
    await this.driver.waitUntil(
      async () => this.driver.isElementPresentAndVisible(this.swapButton, 500),
      { timeout: 10000, interval: 200, stableFor: 500 },
    );
  }
}

export default SwapPage;
