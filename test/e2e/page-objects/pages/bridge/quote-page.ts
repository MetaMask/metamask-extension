import { strict as assert } from 'assert';
import { Key } from 'selenium-webdriver';
import { Driver } from '../../../webdriver/driver';
import { getRegistryBooleanFlag } from '../../../feature-flags/feature-flag-registry';

export type BridgeQuote = {
  amount: string;
  tokenFrom?: string;
  tokenTo?: string;
  fromChain?: string;
  toChain?: string;
  unapproved?: boolean;
};

class BridgeQuotePage {
  protected driver: Driver;

  public assetInfoIcon = (assetId: string) => ({
    tag: 'button' as const,
    testId: `bridge-asset-info-icon-${assetId}`,
  });

  public assetPickerModal = { testId: 'bridge-asset-picker-modal' };

  public assetPrickerSearchInput =
    '[data-testid="bridge-asset-picker-search-input"]';

  private backButton = '[aria-label="Back"]';

  private confirmButton =
    '[data-testid="confirm-sign-and-send-transaction-confirm-snap-footer-button"]';

  public destinationAssetPickerButton =
    '[data-testid="bridge-destination-button"]';

  private destinationAmount = (amount: string) =>
    `[data-testid="to-amount"][value="${amount}"]`;

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

  private moreETHneededForGas =
    '[data-testid="bridge-insufficient-gas-for-quote"]';

  private networkFees = '[data-testid="network-fees"]';

  private networkNameSelector = (network: string) =>
    `[data-testid="${network}"]`;

  private networkSelector = '[data-testid="multichain-asset-picker__network"]';

  private noOptionAvailable = '[data-testid="bridge-no-options-available"]';

  private slippageCustomButton =
    '[data-testid="bridge__tx-settings-modal-custom-button"]';

  private slippageCustomInput =
    'input[data-testid="bridge__tx-settings-modal-custom-input"]';

  private slippageEditButton = '[data-testid="slippage-edit-button"]';

  private sourceAmount = '[data-testid="from-amount"]';

  public sourceAssetPickerButton = '[data-testid="bridge-source-button"]';

  private statusPageCloseButton =
    '[data-testid="smart-transaction-status-page-footer-close-button"]';

  private submitButton = '[data-testid="bridge-cta-button"]';

  private switchTokensButton = '[data-testid="switch-tokens"]';

  public tokenButton = '[data-testid^="bridge-asset--"]';

  constructor(driver: Driver) {
    this.driver = driver;
  }

  /**
   * Checks that the bridge quote page is loaded.
   *
   * @param timeout - Optional timeout in milliseconds. Defaults to 10000.
   */
  async checkPageIsLoaded(timeout: number = 10000): Promise<void> {
    try {
      await this.driver.waitForSelector(this.sourceAssetPickerButton, {
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

  enterBridgeQuote = async (quote: BridgeQuote) => {
    // Source
    if (quote.tokenFrom || quote.fromChain) {
      await this.driver.clickElement(this.sourceAssetPickerButton);
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
      await this.driver.clickElement(this.destinationAssetPickerButton);

      // After clicking destination, we might see either:
      // 1. Network selection modal (if destination is pre-populated and different from desired network)
      // 2. Token picker with network badge (if destination is empty or on the correct network)

      if (quote.toChain) {
        // We're in token picker, need to click network badge first
        await this.driver.waitForSelector(this.networkSelector);
        await this.driver.clickElement(this.networkSelector);

        // Now select the destination network
        await this.driver.clickElementAndWaitToDisappear({
          text: quote.toChain,
        });
      }
      if (quote.tokenTo) {
        await this.driver.pasteIntoField(
          this.assetPrickerSearchInput,
          quote.tokenTo,
        );
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
    await this.driver.waitForSelector(
      { testId: `bridge-asset-info-icon-${assetId}` },
      { timeout: 30000 },
    );
    await this.driver.clickElement(this.assetInfoIcon(assetId));
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

  checkAssetPickerModalIsReopened = async () => {
    await this.driver.waitForSelector(this.assetPickerModal);
    console.log('Asset picker modal is visible');
    await this.driver.clickElementAndWaitToDisappear('[aria-label="Close"]');
    console.log('Asset picker modal closed');
  };

  waitForQuote = async () => {
    await this.driver.waitForSelector(this.submitButton);
  };

  submitQuote = async () => {
    await this.driver.clickElement(this.submitButton);
  };

  submitQuoteAndDismiss = async () => {
    await this.submitQuote();

    await this.dismissStatusPageIfPresent();
  };

  dismissStatusPageIfPresent = async () => {
    const skipStatusPage = getRegistryBooleanFlag(
      'extensionSkipTransactionStatusPage',
    );

    if (skipStatusPage) {
      return;
    }

    await this.driver.clickElement(this.statusPageCloseButton);
  };

  confirmBridgeTransaction = async () => {
    await this.driver.clickElement(this.confirmButton);
  };

  goBack = async () => {
    await this.driver.waitForSelector(this.backButton);
    await this.driver.clickElement(this.backButton);
  };

  async searchAssetAndVerifyCount(
    searchInput: string,
    count: number,
  ): Promise<void> {
    console.log(`Fill search input with ${searchInput}`);
    await this.driver.pasteIntoField(this.assetPrickerSearchInput, searchInput);
    await this.driver.elementCountBecomesN(this.tokenButton, count);
  }

  async checkTokenIsDisabled() {
    const [tkn] = await this.driver.findElements(this.tokenButton);

    await tkn.click();
    const isSelected = await tkn.isSelected();
    assert.equal(isSelected, false);
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

  async checkExpectedNetworkFeeIsDisplayed(): Promise<void> {
    try {
      const balance = await this.driver.waitForSelector(this.networkFees);
      const currentBalanceText = await balance.getText();
      // Verify that the text matches the pattern $XXX.XX
      const pricePattern = /^\$\d+\.\d{2}$/u;
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

  async clickMaxButton(): Promise<void> {
    await this.driver.waitForSelector(this.maxButton);
    await this.driver.clickElement(this.maxButton);
    console.log('Clicked Max button');
  }

  async checkDestAmount(amount: string) {
    await this.driver.waitForSelector(this.destinationAmount(amount));
  }

  async switchTokens(): Promise<void> {
    await this.driver.clickElement(this.switchTokensButton);
  }

  async checkTokenRiskWarningIsDisplayed(
    title: string,
    description: string,
  ): Promise<void> {
    await this.driver.waitForSelector({ text: title });
    await this.driver.waitForSelector({ text: description });
  }

  async setCustomSlippage(value: string): Promise<void> {
    await this.driver.clickElement(this.slippageEditButton);
    await this.driver.clickElement(this.slippageCustomButton);
    const input = await this.driver.waitForSelector(this.slippageCustomInput);
    await input.sendKeys(Key.BACK_SPACE);
    await this.driver.fill(this.slippageCustomInput, value);
    await input.sendKeys(Key.TAB);
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
}

export default BridgeQuotePage;
