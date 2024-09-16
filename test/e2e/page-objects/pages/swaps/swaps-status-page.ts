import { Locator } from '../../../types';
import { BasePage } from '../base-page';
import HomePage from '../home/home-page';

class SwapsBaseStatusPage extends BasePage {
  protected processingHeader: Locator = '';

  protected completeHeader: Locator = '';

  protected mainDescription: Locator = '';

  private closeButton = { text: 'Close', tag: 'button' };

  async waitForTransactionToComplete(tokenName: string) {
    await this.driver.waitForSelector(this.processingHeader);
    await this.driver.waitForSelector(this.completeHeader, { timeout: 30000 });

    await this.driver.findElement({
      css: this.mainDescription,
      text: tokenName,
    });
  }

  async close(): Promise<HomePage> {
    await this.driver.clickElement(this.closeButton);
    return new HomePage(this.driver).check_pageIsLoaded();
  }
}

export class SwapsStatusPage extends SwapsBaseStatusPage {
  protected processingHeader = {
    css: '[data-testid="awaiting-swap-header"]',
    text: 'Processing',
  };

  protected completeHeader = {
    css: '[data-testid="awaiting-swap-header"]',
    text: 'Transaction complete',
  };

  protected mainDescription = '[data-testid="awaiting-swap-main-description"]';
}

export class SwapsSTXStatusPage extends SwapsBaseStatusPage {
  protected processingHeader = {
    css: '[data-testid="swap-smart-transaction-status-header"]',
    text: 'Privately submitting your Swap',
  };

  protected completeHeader = {
    css: '[data-testid="swap-smart-transaction-status-header"]',
    text: 'Swap complete!',
  };

  protected mainDescription =
    '[data-testid="swap-smart-transaction-status-description"]';
}
