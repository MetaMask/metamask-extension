import { Driver } from '../../../webdriver/driver';

export type SwapSolanaOptions = {
  amount: number;
  swapFrom: string;
  swapTo?: string;
  swapToContractAddress?: string;
};

export type SwapSolanaReviewOptions = {
  swapFrom: string;
  swapTo: string;
  swapToAmount: number;
  swapFromAmount?: number;
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

  private readonly swapAmount =
    '[data-testid="prepare-swap-page-from-token-amount"]';

  private readonly destinationTokenButton =
    '[data-testid="prepare-swap-page-swap-to"]';

  private readonly swapButton = {
    tag: 'button',
    text: 'Swap',
  };

  private readonly closeButton = {
    tag: 'button',
    text: 'Close',
  };

  private readonly bridgeSourceButton = '[data-testid="bridge-source-button"]';

  private readonly bridgeDestinationButton =
    '[data-testid="bridge-destination-button"]';

  private readonly fromAmount = '[data-testid="from-amount"]';

  private readonly transactionHeader = '[data-testid="awaiting-swap-header"]';

  constructor(driver: Driver) {
    this.driver = driver;
  }

  async check_pageIsLoaded(): Promise<void> {
    try {
      await this.driver.waitForMultipleSelectors([
        this.swapAmount,
        this.destinationTokenButton,
      ]);
    } catch (e) {
      console.log(
        'Timeout while waiting for Advanced Settings page to be loaded',
        e,
      );
      throw e;
    }
    console.log('Advanced Settings page is loaded');
  }

  async clickOnMoreQuotes(): Promise<void> {
    await this.driver.clickElement({
      text: `More quotes`,
      tag: 'button',
    });
  }

  async checkQuote(quote: SwapQuote): Promise<void> {
    await this.driver.waitForSelector({
      text: quote.amount,
      tag: 'p',
    });
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
    await this.driver.clickElement('header button');
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

  async submitSwap(): Promise<void> {
    console.log('Submit Swap');
    await this.driver.clickElement(this.swapButton);
    await this.driver.delay(1500);
    // console.log('Processing Swap');
    // await this.swapProcessingMessageCheck('Processing');
    console.log('Swap Transaction complete');
    await this.swapProcessingMessageCheck('Transaction complete');
    await this.driver.clickElement(this.closeButton);
  }

  async dismissManualTokenWarning(): Promise<void> {
    console.log('Dismiss manual token warning');
    await this.driver.clickElement({
      text: 'Continue swapping',
      tag: 'button',
    });
  }

  async checkNoQuotesAvailable(): Promise<void> {
    await this.driver.waitForSelector({
      text: `This trade route isn't available right now. Try changing the amount, network, or token and we'll find the best option`,
      tag: 'p',
    });
  }

  async createSolanaSwap(options: SwapSolanaOptions) {
    await this.driver.clickElement(this.bridgeSourceButton, 3);
    await this.driver.delay(2000);

    await this.driver.clickElement({
      text: options.swapFrom,
      css: '[data-testid="multichain-token-list-button"] p',
    });

    await this.driver.clickElement(this.bridgeDestinationButton, 3);

    await this.driver.clickElement({
      text: options.swapTo,
      css: '[data-testid="multichain-token-list-button"] p',
    });

    await this.driver.waitForSelector(this.fromAmount);
    await this.driver.fill(this.fromAmount, options.amount.toString());
  }

  async reviewSolanaQuote(options: SwapSolanaReviewOptions) {
    await this.driver.waitForSelector({
      text: `1 ${options.swapFrom} = ${options.swapToAmount} ${options.swapTo}`,
      tag: 'p',
    });
    await this.driver.waitForSelector({
      text: `Rate includes 0.875% fee`,
      tag: 'p',
    });
    await this.driver.waitForSelector({
      text: `More quotes`,
      tag: 'button',
    });

    await this.driver.clickElement('[data-testid="bridge-cta-button"]');
  }
}

export default SwapPage;
