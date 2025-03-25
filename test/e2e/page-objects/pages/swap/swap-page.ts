import { Driver } from '../../../webdriver/driver';

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

  private readonly closeButtonId = '[data-testid="page-container-footer-next"]';

  private readonly transactionConfirmationText = {
    css: '[data-testid="awaiting-swap-header"]',
    text: 'Transaction complete',
  };

  private readonly transactionProcessingText = {
    css: '[data-testid="awaiting-swap-header"]',
    text: 'Processing',
  };

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

  async processingSwap(): Promise<void> {
    console.log('Processing Swap');
    await this.driver.wait(async () => {
      const confirmedTxes = await this.driver.findElements(
        this.transactionProcessingText,
      );
      return confirmedTxes.length === 1;
    }, 10000);
  }

  async submitSwap(): Promise<void> {
    console.log('Submit Swap');
    await this.driver.clickElement(this.swapButton);
    await this.processingSwap();
    console.log('Transaction complete');
    await this.driver.wait(async () => {
      const confirmedTxes = await this.driver.findElements(
        this.transactionConfirmationText,
      );
      return confirmedTxes.length === 1;
    }, 10000);
    await this.driver.clickElement(this.closeButtonId);
    // await this.driver.clickElement(this.closeButton);
  }

  async dismissManualTokenWarning(): Promise<void> {
    console.log('Dismiss manual token warning');
    await this.driver.clickElement({
      text: 'Continue swapping',
      tag: 'button',
    });
  }
}

export default SwapPage;
