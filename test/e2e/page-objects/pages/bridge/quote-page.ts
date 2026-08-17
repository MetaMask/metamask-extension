import { strict as assert } from 'assert';
import { Key } from 'selenium-webdriver';
import { Driver } from '../../../webdriver/driver';

/**
 * The prepare page debounces quote parameter updates by 300ms before sending
 * them to the bridge controller, so anything longer than that is enough for a
 * pending update to be delivered.
 */
const QUOTE_PARAMS_DEBOUNCE_MS = 500;

export type BridgeQuote = {
  amount: string;
  tokenFrom?: string;
  tokenTo?: string;
  fromChain?: string;
  toChain?: string;
  unapproved?: boolean;
};

/**
 * Unified SwapBridge prepare/quote UI: source/destination assets, amount, and
 * submit.
 *
 * Screen: `#/cross-chain/swaps/prepare-bridge-page` (and the nested assets
 * picker at `#/cross-chain/swaps/prepare-bridge-page/assets`).
 * Owns: source/destination asset pickers and search, network selection in the
 * picker, amount entry (including Max), quote fetch/ready checks, fee and
 * price-impact messaging, insufficient-funds / geo-block states, slippage
 * controls, and the bridge CTA / snap confirm footer used after submit.
 * Boundaries: the prepare and quote surface. Post-submit redesigned
 * confirmations and activity belong elsewhere; same-chain swap helpers that
 * wrap this page live on `SwapPage`.
 * Related: `SwapPage` (swap-oriented wrapper that delegates picker steps
 * here); `flows/bridge.flow.ts` for end-to-end bridge journeys.
 *
 * @see ui/pages/bridge/index.tsx
 * @see ui/pages/bridge/prepare/prepare-bridge-page.tsx
 * @see test/e2e/page-objects/flows/bridge.flow.ts
 */
class BridgeQuotePage {
  public assetInfoIcon = (assetId: string) => ({
    tag: 'button' as const,
    testId: `bridge-asset-info-icon-${assetId}`,
  });

  public assetPrickerSearchInput =
    '[data-testid="bridge-asset-picker-search-input"]';

  private backButton = '[aria-label="Back"]';

  private readonly bridgeQuotePage = {
    testId: 'parent-selector-bridge-quote',
  };

  private closeButton = '[aria-label="Close"]';

  private confirmButton =
    '[data-testid="confirm-sign-and-send-transaction-confirm-snap-footer-button"]';

  private destinationAmount = (amount: string) =>
    `[data-testid="to-amount"][value="${amount}"]`;

  public destinationAssetPickerButton =
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

  private moreETHneededForGas = '[data-testid="bridge-insufficient-gas"]';

  private networkFees = '[data-testid="network-fees"]';

  private networkNameSelector = (network: string) =>
    `[data-testid="${network}"]`;

  private networkSelector = '[data-testid="multichain-asset-picker__network"]';

  private noOptionAvailable = '[data-testid="bridge-no-quotes"]';

  private priceImpactQuoteCardButton =
    '[data-testid="price-impact-warning-button"]';

  private rwaGeoRestrictedMessage = {
    css: '[data-testid="bridge-no-quotes"]',
    text: "This swap isn't available in your region.",
  };

  private slippageCustomButton =
    '[data-testid="bridge__tx-settings-modal-custom-button"]';

  private slippageCustomInput =
    'input[data-testid="bridge__tx-settings-modal-custom-input"]';

  private slippageEditButton = '[data-testid="slippage-edit-button"]';

  private sourceAmount = '[data-testid="from-amount"]';

  public sourceAssetPickerButton = '[data-testid="bridge-source-button"]';

  private submitButton = '[data-testid="bridge-cta-button"]';

  private switchTokensButton = '[data-testid="switch-tokens"]';

  public tokenButton = '[data-testid^="bridge-asset--"]';

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
   * Checks that the asset picker is shown again after navigating back from an
   * asset page, then leaves it to return to the swap form.
   */
  checkAssetPickerIsReopened = async () => {
    await this.driver.waitForSelector(this.assetPrickerSearchInput);
    console.log('Asset picker is visible');
    // The swap form has a back button with the same label as the picker's, so
    // wait for the picker to go away instead of for the button itself.
    await this.driver.clickElement(this.backButton);
    await this.driver.assertElementNotPresent(this.assetPrickerSearchInput);
    console.log('Asset picker closed');
  };

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

  async checkDestAmount(amount: string) {
    await this.driver.waitForSelector(this.destinationAmount(amount));
  }

  async checkExpectedNetworkFeeIsDisplayed(): Promise<void> {
    try {
      const balance = await this.driver.waitForSelector(this.networkFees);
      const currentBalanceText = await balance.getText();
      // Verify that the text matches the pattern $XXX.XX or $0.00X (for small fees < $0.01)
      const pricePattern = /^\$\d+\.\d{2,4}$/u;
      if (!pricePattern.test(currentBalanceText)) {
        throw new Error(`Price format is not valid: ${currentBalanceText}`);
      }
    } catch (e: unknown) {
      console.log(
        `Error checking price format: ${
          e instanceof Error ? e.message : String(e)
        }`,
      );
      throw e;
    }
    console.log('Price matches expected format');
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
    try {
      await this.driver.waitForSelector(this.insufficientFundsButton);
    } catch (e) {
      console.log(`Expected button "Insufficient funds" is not present`);
      throw e;
    }
    console.log('The button "Insufficient funds" is displayed');
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
   * Checks that the bridge quote page is loaded.
   *
   * @param timeout - Optional timeout in milliseconds. Defaults to 10000.
   */
  async checkPageIsLoaded(timeout: number = 10000): Promise<void> {
    try {
      await this.driver.waitForSelector(this.bridgeQuotePage, {
        timeout,
      });
    } catch (e) {
      console.log(
        'Timeout while waiting for bridge quote page to be loaded',
        e,
      );
      throw e;
    }
    console.log('Bridge quote page is loaded');
  }

  checkPriceImpactModalIsDisplayed = async () => {
    await this.driver.clickElement(this.priceImpactQuoteCardButton);
    await this.driver.waitForSelector(this.warningModal);
    await this.driver.clickElementAndWaitToDisappear(
      this.warningModalCancelButton,
    );
  };

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

  async checkTokenIsDisabled() {
    const [tkn] = await this.driver.findElements(this.tokenButton);

    await tkn.click();
    const isSelected = await tkn.isSelected();
    assert.equal(isSelected, false);
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

  closeModal = async () => {
    await this.driver.clickElement(this.closeButton);
  };

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
   * Fills in the swap/bridge form.
   *
   * @param quote - The quote inputs to enter.
   * @param options - Options.
   * @param options.openPickersWithDebounce - Opens the asset pickers via
   * `openAssetPickerWithDebounce`. Set this only when the test asserts on
   * `Input Changed` metrics events.
   */
  enterBridgeQuote = async (
    quote: BridgeQuote,
    {
      openPickersWithDebounce = false,
    }: { openPickersWithDebounce?: boolean } = {},
  ) => {
    const openAssetPicker = async (pickerButton: string) => {
      if (openPickersWithDebounce) {
        await this.openAssetPickerWithDebounce(pickerButton);
        return;
      }
      await this.driver.clickElement(pickerButton);
    };

    // Source
    if (quote.tokenFrom || quote.fromChain) {
      await openAssetPicker(this.sourceAssetPickerButton);
      if (quote.fromChain) {
        await this.driver.clickElement(this.networkSelector);
        await this.driver.clickElement(`[data-testid="${quote.fromChain}"]`);
      }
      if (quote.tokenFrom) {
        await this.driver.pasteIntoField(
          this.assetPrickerSearchInput,
          quote.tokenFrom,
        );
        await this.driver.clickElement({
          text: quote.tokenFrom,
          css: this.tokenButton,
        });
      }
    }

    // Destination
    if (quote.tokenTo || quote.toChain) {
      await this.driver.waitForSelector(this.destinationAssetPickerButton);
      await openAssetPicker(this.destinationAssetPickerButton);

      // After clicking destination, we might see either:
      // 1. Network selection modal (if destination is pre-populated and different from desired network)
      // 2. Token picker with network badge (if destination is empty or on the correct network)

      if (quote.toChain) {
        // We're in token picker, need to click network badge first
        await this.driver.waitForSelector(this.networkSelector);
        await this.driver.clickElement(this.networkSelector);

        // Now select the destination network
        await this.driver.clickElementAndWaitToDisappear(
          this.networkNameSelector(quote.toChain),
        );
      }
      if (quote.tokenTo) {
        await this.driver.pasteIntoField(
          this.assetPrickerSearchInput,
          quote.tokenTo,
        );
        await this.driver.delay(2000);
        await this.driver.clickElementAndWaitToDisappear({
          text: quote.tokenTo,
          css: this.tokenButton,
        });
      }
    }

    // QTY
    await this.driver.fill(this.sourceAmount, quote.amount);
    await this.driver.assertElementNotPresent(this.fetchingQuotesLabel, {
      waitAtLeastGuard: 500,
    });
  };

  goBack = async () => {
    await this.driver.waitForSelector(this.backButton);
    await this.driver.clickElement(this.backButton);
  };

  /**
   * Navigates away from the bridge page via the bottom nav bar home tab.
   * Use this instead of `goBack` when the user is in the bottom nav AB test
   * treatment, where the back button is removed on the swap/bridge page.
   */
  goBackViaBottomNavHome = async () => {
    const homeTab = '[data-testid="bottom-nav-home"]';
    await this.driver.waitForSelector(homeTab);
    await this.driver.clickElement(homeTab);
  };

  /**
   * Opens an asset picker, giving the prepare page time to send its pending
   * quote parameter update first. Only needed by tests that assert on
   * `Input Changed` metrics events: when the network management feature flag is
   * on, the picker is a separate route, so opening it unmounts the prepare page
   * and cancels that debounced update, folding the input changes made before it
   * into a later event.
   *
   * @param pickerButton - Selector of the asset picker button to click.
   */
  openAssetPickerWithDebounce = async (pickerButton: string) => {
    await this.driver.delay(QUOTE_PARAMS_DEBOUNCE_MS);
    await this.driver.clickElement(pickerButton);
  };

  rejectModal = async () => {
    await this.driver.clickElement(this.warningModalCancelButton);
  };

  async searchAndClickAssetInfo({
    token,
    assetId,
    assetPicker = this.sourceAssetPickerButton,
  }: {
    token: string;
    assetId: string;
    assetPicker?: string;
  }) {
    console.log(`Opening asset info icon for asset ${token}`);
    await this.driver.clickElement(assetPicker);
    await this.driver.pasteIntoField(this.assetPrickerSearchInput, token);
    await this.driver.waitForSelector({
      testId: `bridge-asset-info-icon-${assetId}`,
    });
    await this.driver.clickElement(this.assetInfoIcon(assetId));
  }

  async searchAssetAndVerifyCount(
    searchInput: string,
    count: number,
  ): Promise<void> {
    console.log(`Fill search input with ${searchInput}`);
    await this.driver.pasteIntoField(this.assetPrickerSearchInput, searchInput);
    await this.driver.elementCountBecomesN(this.tokenButton, count);
  }

  searchForAssetAndSelect = async (
    token: string,
    assetPicker = this.sourceAssetPickerButton,
  ) => {
    console.log(`Opening asset picker`);
    await this.driver.clickElement(assetPicker);
    await this.driver.pasteIntoField(this.assetPrickerSearchInput, token);
    console.log(`Filled search input with ${token}`);
    await this.driver.clickElementAndWaitToDisappear({
      css: this.tokenButton,
      text: token,
    });
  };

  async selectDestToken(token: string): Promise<void> {
    await this.driver.waitForSelector(this.destinationAssetPickerButton);
    await this.driver.clickElement(this.destinationAssetPickerButton);
    await this.driver.pasteIntoField(this.assetPrickerSearchInput, token);
    await this.driver.clickElementAndWaitToDisappear({
      text: token,
      css: this.tokenButton,
    });
  }

  async selectNetwork(network: string): Promise<void> {
    await this.driver.clickElement(this.networkSelector);
    await this.driver.clickElement(this.networkNameSelector(network));
  }

  async selectSrcToken(token: string): Promise<void> {
    await this.driver.waitForSelector(this.sourceAssetPickerButton);
    await this.driver.clickElement(this.sourceAssetPickerButton);
    await this.driver.pasteIntoField(this.assetPrickerSearchInput, token);
    await this.driver.clickElementAndWaitToDisappear({
      text: token,
      css: this.tokenButton,
    });
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

  async switchTokens(): Promise<void> {
    await this.driver.clickElement(this.switchTokensButton);
  }

  waitForQuote = async () => {
    await this.driver.waitForSelector(this.submitButton);
  };
}

export default BridgeQuotePage;
