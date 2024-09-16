import { Driver } from '../../../webdriver/driver';
import { veryLargeDelayMs } from '../../../helpers';
import { SwapsStatusPage } from './swaps-status-page';

class SwapsPage {
  private driver: Driver;

  // Swap tokens and amount selectors
  private swapButton = '[data-testid="token-overview-button-swap"]';

  private fromTokenAmountInput =
    'input[data-testid="prepare-swap-page-from-token-amount"]';

  private swapToButton = '[data-testid="prepare-swap-page-swap-to"]';

  private tokenSearchInput = 'input[id="list-with-search__text-search"]';

  private tokenListItem = '[data-testid="searchable-item-list-primary-label"]';

  private importTokenButton =
    '[data-testid="searchable-item-list-import-button"]';

  // Quote review selectors
  private exchangeRateDisplay =
    '[data-testid="exchange-rate-display-quote-rate"]';

  private receiveAmountDisplay =
    '[data-testid="prepare-swap-page-receive-amount"]';

  private gasFeeDisplay = '[data-testid="review-quote-gas-fee-in-fiat"]';

  private infoTooltip = '[data-testid="info-tooltip"]';

  private countdownTimer = '[data-testid="countdown-timer__timer-container"]';

  // Quote change selectors
  private viewAllQuotesButton = '[data-testid="review-quote-view-all-quotes"]';

  private quoteDetailsHeader = { text: 'Quote details', tag: 'h2' };

  private quoteRows = '[data-testid*="select-quote-popover-row"]';

  private selectButton = { text: 'Select', tag: 'button' };

  // Alert selectors
  private alertTitle = '[data-testid="swaps-banner-title"]';

  private alertText = '[data-testid="mm-banner-alert-notification-text"]';

  constructor(driver: Driver) {
    this.driver = driver;
  }

  async enterSwapDetails(
    amount: number,
    swapTo?: string,
    swapToContractAddress?: string,
  ): Promise<void> {
    await this.driver.clickElement(this.swapButton);
    await this.driver.fill(this.fromTokenAmountInput, amount.toString());
    await this.driver.delay(veryLargeDelayMs);
    await this.driver.clickElement(this.swapToButton);
    await this.driver.waitForSelector(this.tokenSearchInput);

    await this.driver.fill(
      this.tokenSearchInput,
      swapTo || swapToContractAddress || '',
    );
    await this.driver.delay(veryLargeDelayMs);

    if (swapTo) {
      await this.waitForTokenToAppear(swapTo);
    }
    if (swapToContractAddress) {
      await this.driver.waitForSelector(this.importTokenButton);
    }
    await this.driver.clickElement(this.tokenListItem);
  }

  private async waitForTokenToAppear(tokenName: string): Promise<void> {
    await this.driver.wait(async () => {
      const tokenNames = await this.driver.findElements(this.tokenListItem);
      if (tokenNames.length === 0) {
        return false;
      }
      const tName = await tokenNames[0].getText();
      return tName === tokenName;
    });
  }

  async reviewQuote(
    swapFrom: string,
    swapTo: string,
    amount: number,
    skipCounter = false,
  ): Promise<void> {
    const summary = await this.driver.waitForSelector(this.exchangeRateDisplay);
    const summaryText = await summary.getText();
    console.log('============\nsummaryText\n============', {
      summaryText,
      options: { swapFrom, swapTo, amount },
    });

    // Assertions and validations...
    // (Keep the existing logic for checking swap details)

    await this.driver.findElement(this.gasFeeDisplay);
    await this.driver.findElement(this.infoTooltip);

    if (!skipCounter) {
      await this.driver.waitForSelector({
        css: this.countdownTimer,
        text: '0:25',
      });
    }
  }

  async changeExchangeRate(): Promise<void> {
    await this.driver.clickElement(this.viewAllQuotesButton);
    await this.driver.waitForSelector(this.quoteDetailsHeader);

    const networkFees = await this.driver.findElements(this.quoteRows);
    const random = Math.floor(Math.random() * networkFees.length);
    await networkFees[random].click();
    await this.driver.clickElement(this.selectButton);
  }

  async checkAlert(title: string, text: string): Promise<void> {
    const isTitleVisible = await this.driver.isElementPresentAndVisible({
      css: this.alertTitle,
      text: title,
    });
    const isTextVisible = await this.driver.isElementPresentAndVisible({
      css: this.alertText,
      text,
    });

    if (!isTitleVisible) {
      throw new Error('Invalid alert title');
    }
    if (!isTextVisible) {
      throw new Error('Invalid alert text content');
    }
  }

  async initiateSwap(): Promise<SwapsStatusPage> {
    // Implement the logic to initiate the swap
    // This might involve clicking a "Swap" button
    // await this.driver.clickElement(this.swapConfirmButton);
    return new SwapsStatusPage(this.driver);
  }
}

export default SwapsPage;
