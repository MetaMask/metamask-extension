import { strict as assert } from 'assert';
import { Driver } from '../../../webdriver/driver';

export type SwapSolanaOptions = {
  amount: number;
  swapFrom: string;
  swapTo: string;
  swapToContractAddress?: string;
};

export type SwapSolanaReviewOptions = {
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
  amount: string;
  totalCost: string;
  receivedAmount: string;
  estimatedTime?: string;
  provider?: string;
};

class SwapPage {
  private readonly driver: Driver;

  private readonly bridgeSourceButton = '[data-testid="bridge-source-button"]';

  private readonly bridgeDestinationButton =
    '[data-testid="bridge-destination-button"]';

  private readonly closeButton = {
    tag: 'button',
    text: 'Close',
  };

  private readonly closeQuotesButton = 'header button';

  private readonly destinationTokenButton =
    '[data-testid="prepare-swap-page-swap-to"]';

  private readonly fromToText =
    '[data-testid="multichain-token-list-button"] p';

  private readonly moreQuotesButton = {
    tag: 'button',
    text: 'More quotes',
  };

  private readonly noQuotesAvailableMessage = {
    text: "This trade route isn't available right now. Try changing the amount, network, or token and we'll find the best option",
    tag: 'p',
  };

  private readonly gasIncludedLabel = {
    text: 'included',
    tag: 'h6',
  };

  private readonly rateMessage = {
    text: `Rate includes 0.875% fee`,
    tag: 'p',
  };

  private readonly reviewToAmount = '[data-testid="to-amount"]';

  private readonly reviewFromAmount = '[data-testid="from-amount"]';

  private readonly submitSwapButton = '[data-testid="bridge-cta-button"]';

  private readonly transactionStatusHeader =
    '[data-testid="swap-smart-transaction-status-header"]';

  private readonly transactionStatusDescription =
    '[data-testid="swap-smart-transaction-status-description"]';

  private readonly swapAmount =
    '[data-testid="prepare-swap-page-from-token-amount"]';

  private readonly swapButton = {
    tag: 'button',
    text: 'Swap',
  };

  private readonly transactionHeader = '[data-testid="awaiting-swap-header"]';

  constructor(driver: Driver) {
    this.driver = driver;
  }

  async checkPageIsLoaded(): Promise<void> {
    try {
      await this.driver.waitForMultipleSelectors([
        this.swapAmount,
        this.destinationTokenButton,
      ]);
    } catch (e) {
      console.log('Timeout while waiting for Swap page to be loaded', e);
      throw e;
    }
    console.log('Swap page is loaded');
  }

  async clickOnMoreQuotes(): Promise<void> {
    await this.driver.clickElement(this.moreQuotesButton);
  }

  async checkQuote(quote: SwapQuote): Promise<void> {
    await this.driver.waitForSelector({
      text: `${quote.totalCost} total cost`,
      tag: 'p',
    });
    await this.driver.waitForSelector({
      text: `${quote.receivedAmount} receive amount`,
      tag: 'p',
    });
    await this.driver.waitForSelector({
      text: quote.estimatedTime,
      tag: 'p',
    });
    await this.driver.waitForSelector({
      text: quote.provider,
      tag: 'p',
    });
  }

  async closeQuotes(): Promise<void> {
    await this.driver.clickElementAndWaitToDisappear(this.closeQuotesButton);
  }

  async enterSwapAmount(amount: string): Promise<void> {
    console.log('Entering swap amount');
    const stxToggle = await this.driver.findElement(this.swapAmount);
    stxToggle.sendKeys(amount);
  }

  async selectDestinationToken(destinationToken: string): Promise<void> {
    console.log('Entering swap amount');
    await this.driver.clickElement(this.destinationTokenButton);
    await this.driver.clickElement({
      tag: 'span',
      text: destinationToken,
    });
  }

  async swapProcessingMessageCheck(message: string): Promise<void> {
    await this.driver.wait(async () => {
      const confirmedTxs = await this.driver.findElements({
        css: this.transactionHeader,
        text: message,
      });
      return confirmedTxs.length === 1;
    }, 10000);
  }

  async checkSwapButtonIsEnabled(): Promise<void> {
    await this.driver.waitForSelector(this.swapButton, {
      state: 'enabled',
    });
  }

  async submitSwap(): Promise<void> {
    console.log('Submit Swap');
    await this.driver.clickElement(this.swapButton);
    await this.driver.delay(1500);
  }

  async dismissManualTokenWarning(): Promise<void> {
    console.log('Dismiss manual token warning');
    // https://github.com/MetaMask/metamask-extension/issues/31426
    await this.driver.clickElementSafe({
      text: 'Continue swapping',
      tag: 'button',
    });
  }

  async checkNoQuotesAvailable(): Promise<void> {
    await this.driver.waitForSelector(this.noQuotesAvailableMessage);
  }

  async checkQuoteIsGasIncluded(): Promise<void> {
    await this.driver.waitForSelector(this.gasIncludedLabel);
  }

  async waitForTransactionToComplete(): Promise<void> {
    console.log('Swap Transaction complete');
    await this.swapProcessingMessageCheck('Transaction complete');
    await this.driver.clickElement(this.closeButton);
  }

  async waitForSmartTransactionToComplete(tokenName: string): Promise<void> {
    console.log('Wait for Smart Transaction to complete');

    await this.driver.waitForSelector({
      css: this.transactionStatusHeader,
      text: 'Privately submitting your Swap',
    });

    await this.driver.waitForSelector(
      {
        css: this.transactionStatusHeader,
        text: 'Swap complete!',
      },
      { timeout: 30000 },
    );

    await this.driver.findElement({
      css: this.transactionStatusDescription,
      text: `${tokenName}`,
    });
    await this.driver.clickElement(this.closeButton);
  }

  async createSolanaSwap(options: SwapSolanaOptions) {
    await this.driver.clickElement(this.bridgeSourceButton);
    await this.driver.clickElement({
      text: options.swapFrom,
      css: this.fromToText,
    });

    await this.driver.clickElement(this.bridgeDestinationButton);

    await this.driver.clickElement({
      text: options.swapTo,
      css: this.fromToText,
    });

    await this.driver.waitForSelector(this.reviewFromAmount);
    await this.driver.fill(this.reviewFromAmount, options.amount.toString());
  }

  async reviewSolanaQuote(options: SwapSolanaReviewOptions) {
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
}

export default SwapPage;
