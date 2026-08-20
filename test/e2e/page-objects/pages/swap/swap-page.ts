import { strict as assert } from 'assert';
import { Driver } from '../../../webdriver/driver';
import BridgeQuotePage from '../bridge/quote-page';

export type SwapOptions = {
  amount: number;
  swapFrom: string;
  swapTo: string;
  network: string;
  swapToContractAddress?: string;
};

export type SwapReviewOptions = {
  swapFrom: string;
  swapTo: string;
  swapToAmount: string;
  swapFromAmount: string;
  skipCounter?: boolean;
};

export type SwapQuoteOptions = {
  swapFrom: string;
  swapTo: string;
  swapToAmount: number;
};

export type SwapQuote = {
  totalCost: string;
  receivedAmount: string;
  receivedAmountInCurrency?: string;
  provider?: string;
};

/**
 * Same-chain swap helpers on Unified SwapBridge, plus a few legacy Metaswap
 * status selectors.
 *
 * Screen: primarily `#/cross-chain/swaps/prepare-bridge-page` (bridge-*
 * source/destination/CTA/quotes). Also asserts some post-submit Metaswap
 * surfaces via `awaiting-swap-*`, `swaps-banner-title`, and smart-tx status
 * test ids when those screens still appear.
 * Owns: building a swap (delegating network/token picker steps to
 * `BridgeQuotePage`), quote checks, submit, quotes modal, notification
 * banners, and awaiting/complete status checks.
 * Boundaries: swap-oriented prepare/submit and status. Full bridge journeys
 * and shared quote-page APIs belong on `BridgeQuotePage` /
 * `flows/bridge.flow.ts`.
 * Related: `BridgeQuotePage`, `flows/bridge.flow.ts`.
 *
 * @see ui/pages/bridge/prepare/prepare-bridge-page.tsx
 * @see ui/pages/bridge/quotes/bridge-quotes-modal.tsx
 * @see ui/pages/swaps/awaiting-swap/awaiting-swap.js
 * @see ui/pages/swaps/swaps-banner-alert/swaps-banner-alert.js
 */
class SwapPage {
  private readonly assetPickerSearchInput =
    '[data-testid="bridge-asset-picker-search-input"]';

  private readonly awaitingSwapDescription =
    '[data-testid="awaiting-swap-main-description"]';

  private readonly bridgeAsset = '[data-testid^="bridge-asset--"]';

  private readonly bridgeDestinationButton =
    '[data-testid="bridge-destination-button"]';

  private readonly bridgeQuotePage = {
    testId: 'parent-selector-bridge-quote',
  };

  private readonly bridgeSourceButton = '[data-testid="bridge-source-button"]';

  private readonly closeButton = {
    tag: 'button',
    text: 'Close',
  };

  private readonly closeQuotesButton = 'header button';

  private readonly driver: Driver;

  private readonly gasIncludedLabel = {
    text: 'Included',
    tag: 'p',
  };

  private readonly importTokensButton =
    '[data-testid="import-tokens-import-button"]';

  private readonly insufficientFundsButton = {
    text: 'Insufficient funds',
    css: '[data-testid="bridge-cta-button"]',
  };

  private readonly maxButton = {
    text: 'Max',
    tag: 'button',
  };

  private readonly minimumReceived = '[data-testid="minimum-received"]';

  private readonly moreQuotesButton = '[aria-label="More quotes"]';

  private readonly networkFees = '[data-testid="network-fees"]';

  private readonly noQuotesAvailableMessage = {
    text: "This trade route isn't available right now. Try changing the amount, network, or token and we'll find the best option",
    tag: 'p',
  };

  private readonly quotesModal = '.quotes-modal';

  private readonly quotesModalRow =
    '.quotes-modal [style*="position: relative"]';

  private readonly rateMessage = {
    text: `Includes 0.875% MetaMask fee`,
    tag: 'p',
  };

  private readonly reviewFromAmount = '[data-testid="from-amount"]';

  private readonly reviewToAmount = '[data-testid="to-amount"]';

  private readonly slippageEditButton = '[data-testid="slippage-edit-button"]';

  private readonly submitSwapButton = '[data-testid="bridge-cta-button"]';

  private readonly swapButton = {
    css: '[data-testid="bridge-cta-button"]',
    text: 'Swap',
  };

  private readonly swapsBannerTitle = '[data-testid="swaps-banner-title"]';

  private readonly transactionCompleteHeader = {
    tag: 'h4',
    text: 'Your transaction is complete',
  };

  private readonly transactionHeader = '[data-testid="awaiting-swap-header"]';

  private readonly transactionStatusDescription =
    '[data-testid="swap-smart-transaction-status-description"]';

  private readonly transactionStatusHeader =
    '[data-testid="swap-smart-transaction-status-header"]';

  private readonly viewActivityButton = {
    tag: 'button',
    text: 'View activity',
  };

  constructor(driver: Driver) {
    this.driver = driver;
  }

  async checkDestinationToken(token: string): Promise<void> {
    await this.driver.waitForSelector({
      css: this.bridgeDestinationButton,
      text: token,
    });
  }

  async checkInsufficientFundsButtonIsDisplayed(): Promise<void> {
    await this.driver.waitForSelector(this.insufficientFundsButton);
    await this.driver.waitForSelector(this.submitSwapButton, {
      state: 'disabled',
    });
  }

  async checkNoQuotesAvailable(): Promise<void> {
    await this.driver.waitForSelector(this.noQuotesAvailableMessage);
  }

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

  async checkPageIsLoaded(): Promise<void> {
    try {
      await this.driver.waitForMultipleSelectors([
        this.reviewFromAmount,
        this.bridgeDestinationButton,
        this.bridgeQuotePage,
      ]);
    } catch (e) {
      console.log('Timeout while waiting for Swap page to be loaded', e);
      throw e;
    }
    console.log('Swap page is loaded');
  }

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
      [this.slippageEditButton, this.minimumReceived, this.reviewToAmount],
      options,
    );
  }

  async checkQuoteIsGasIncluded(): Promise<void> {
    await this.driver.waitForSelector(this.gasIncludedLabel);
  }

  async checkSourceToken(token: string): Promise<void> {
    await this.driver.waitForSelector({
      css: this.bridgeSourceButton,
      text: token,
    });
  }

  async checkSwapButtonIsEnabled(): Promise<void> {
    await this.driver.waitForSelector(this.swapButton, {
      state: 'enabled',
    });
  }

  async clickOnMoreQuotes(): Promise<void> {
    await this.driver.clickElement(this.moreQuotesButton);
  }

  async clickViewActivity(): Promise<void> {
    await this.driver.clickElementSafe(this.viewActivityButton);
  }

  async closeQuotes(): Promise<void> {
    await this.driver.clickElementAndWaitToDisappear(this.closeQuotesButton);
  }

  async createSwap(options: SwapOptions) {
    await this.driver.clickElement(this.bridgeSourceButton);
    const bridgeQuotePage = new BridgeQuotePage(this.driver);
    await bridgeQuotePage.selectNetwork(options.network);
    await this.driver.waitForSelector(this.assetPickerSearchInput, {
      timeout: 30000,
    });
    await this.driver.fill(this.assetPickerSearchInput, options.swapFrom);
    await this.driver.waitForSelector(
      {
        css: this.bridgeAsset,
        text: options.swapFrom,
      },
      { timeout: 30000 },
    );
    await this.driver.clickElement({
      css: this.bridgeAsset,
      text: options.swapFrom,
    });

    await this.driver.clickElement(this.bridgeDestinationButton);
    await bridgeQuotePage.selectNetwork(options.network);
    if (options.swapToContractAddress) {
      await this.selectDestinationTokenByContract(
        options.swapToContractAddress,
        {
          pickerAlreadyOpen: true,
        },
      );
    } else {
      await this.driver.waitForSelector(this.assetPickerSearchInput, {
        timeout: 30000,
      });
      await this.driver.fill(this.assetPickerSearchInput, options.swapTo);
      await this.driver.waitForSelector(
        {
          css: this.bridgeAsset,
          text: options.swapTo,
        },
        { timeout: 30000 },
      );
      await this.driver.clickElement({
        css: this.bridgeAsset,
        text: options.swapTo,
      });
    }

    await this.driver.waitForSelector(this.reviewFromAmount);
    await this.driver.fill(this.reviewFromAmount, options.amount.toString());
  }

  async dismissManualTokenWarning(): Promise<void> {
    console.log('Dismiss manual token warning');
    // https://github.com/MetaMask/metamask-extension/issues/31426
    await this.driver.clickElementSafe({
      text: 'Continue swapping',
      tag: 'button',
    });
  }

  async enterSwapAmount(amount: string): Promise<void> {
    console.log('Entering swap amount');
    const stxToggle = await this.driver.findElement(this.reviewFromAmount);
    stxToggle.sendKeys(amount);
  }

  async fillSwapAmount(amount: string): Promise<void> {
    await this.driver.waitForSelector(this.reviewFromAmount);
    await this.driver.fill(this.reviewFromAmount, amount);
  }

  async getFromAmountValue(): Promise<string> {
    const element = await this.driver.waitForSelector(this.reviewFromAmount);
    return element.getAttribute('value');
  }

  async getToAmountValue(): Promise<string> {
    const element = await this.driver.waitForSelector(this.reviewToAmount);
    return element.getAttribute('value');
  }

  async reviewQuote(options: SwapReviewOptions) {
    await this.driver.waitForSelector(this.submitSwapButton);
    const fromAmount = await this.driver.findElement(this.reviewFromAmount);
    const fromAmountText = await fromAmount.getAttribute('value');
    assert.equal(fromAmountText, options.swapFromAmount);
    const toAmount = await this.driver.findElement(this.reviewToAmount);
    const toAmountText = await toAmount.getAttribute('value');
    assert.equal(toAmountText, options.swapToAmount);
    await this.driver.waitForSelector({
      text: `1 ${options.swapFrom} = ${options.swapToAmount} ${options.swapTo}`,
      tag: 'p',
    });
    await this.driver.waitForSelector(this.rateMessage);
    await this.driver.waitForSelector(this.moreQuotesButton);

    await this.driver.clickElementAndWaitToDisappear(this.submitSwapButton);
  }

  async selectAlternativeQuote(): Promise<void> {
    await this.driver.waitForSelector(this.moreQuotesButton);
    await this.driver.clickElement(this.moreQuotesButton);
    await this.driver.waitForSelector({ text: 'Select a quote' });

    await this.driver.executeScript(`
        const quoteRows = Array.from(
          document.querySelectorAll('${this.quotesModalRow}'),
        );
        if (quoteRows.length === 0) {
          throw new Error('No quotes available to select');
        }
        const targetRow = quoteRows[Math.min(1, quoteRows.length - 1)];
        targetRow.scrollIntoView({ block: 'center' });
        targetRow.click();
      `);

    await this.driver.assertElementNotPresent(this.quotesModal);
  }

  async selectDestinationToken(destinationToken: string): Promise<void> {
    console.log('Click destination token button');
    await this.driver.clickElement(this.bridgeDestinationButton);
    await this.driver.waitForSelector(this.assetPickerSearchInput);
    await this.driver.fill(this.assetPickerSearchInput, destinationToken);
    await this.driver.waitForSelector({
      css: this.bridgeAsset,
      text: destinationToken,
    });
    await this.driver.clickElement({
      css: this.bridgeAsset,
      text: destinationToken,
    });
  }

  async selectDestinationTokenByContract(
    contractAddress: string,
    options: { pickerAlreadyOpen?: boolean } = {},
  ): Promise<void> {
    const { pickerAlreadyOpen = false } = options;
    if (!pickerAlreadyOpen) {
      await this.driver.clickElement(this.bridgeDestinationButton);
    }
    await this.driver.waitForSelector(this.assetPickerSearchInput);
    await this.driver.fill(this.assetPickerSearchInput, contractAddress);

    const result = await Promise.any([
      this.driver
        .waitForSelector(this.importTokensButton)
        .then(() => 'import' as const),
      this.driver
        .waitForSelector(this.bridgeAsset)
        .then(() => 'asset' as const),
    ]);

    if (result === 'import') {
      await this.driver.clickElement(this.importTokensButton);
      await this.driver.waitForSelector(this.bridgeAsset);
    }
    await this.driver.clickElement(this.bridgeAsset);
  }

  async selectSourceToken(sourceToken: string): Promise<void> {
    console.log('Click source token button');
    await this.driver.clickElement(this.bridgeSourceButton);
    await this.driver.waitForSelector(this.assetPickerSearchInput);
    await this.driver.fill(this.assetPickerSearchInput, sourceToken);
    await this.driver.waitForSelector({
      css: this.bridgeAsset,
      text: sourceToken,
    });
    await this.driver.clickElement({
      css: this.bridgeAsset,
      text: sourceToken,
    });
  }

  async submitSwap(): Promise<void> {
    console.log('Submit Swap');
    await this.driver.clickElement(this.swapButton);
    await this.driver.delay(1500);
  }

  async swapProcessingMessageCheck(message: string): Promise<void> {
    await this.driver.waitForSelector({
      css: this.transactionHeader,
      text: message,
    });
  }

  async waitForMaxButtonToBeDisplayed(): Promise<void> {
    await this.driver.waitForSelector(this.maxButton);
  }

  async waitForQuote(): Promise<void> {
    console.log('Wait for quote to be displayed');
    await this.driver.waitForSelector(this.swapButton, { timeout: 30000 });
  }

  async waitForSmartTransactionToComplete(): Promise<void> {
    if (
      !(await this.driver.isElementPresentAndVisible(
        this.transactionStatusHeader,
        2000,
      ))
    ) {
      return;
    }
    console.log('Wait for Smart Transaction to complete');
    await this.driver.waitForSelector(this.transactionCompleteHeader, {
      timeout: 30000,
    });
  }

  async waitForTransactionCompleteWithToken(tokenName: string): Promise<void> {
    await this.swapProcessingMessageCheck('Processing');
    await this.driver.waitForSelector(
      { css: this.transactionHeader, text: 'Transaction complete' },
      { timeout: 30000 },
    );
    await this.driver.waitForSelector({
      css: this.awaitingSwapDescription,
      text: tokenName,
    });
    await this.driver.clickElement(this.closeButton);
  }

  async waitForTransactionToComplete(): Promise<void> {
    console.log('Swap Transaction complete');
    await this.swapProcessingMessageCheck('Transaction complete');
    await this.driver.clickElement(this.closeButton);
  }
}

export default SwapPage;
