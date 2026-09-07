import { Driver } from '../../../webdriver/driver';

/**
 * Token / coin asset overview: send, swap, receive, and explorer actions.
 *
 * Screen: `#/asset/:chainId/:asset?...` asset details page.
 * Owns: send/swap/receive/more actions, view-in-explorer, and back navigation
 * on the token overview.
 * Boundaries: the asset overview only. Send/swap destinations and confirmation
 * flows belong to their page objects after leaving this screen.
 * Related: `TokensTab` (entry), `SendPage`, `SwapPage`.
 *
 * @see ui/pages/asset/components/asset-page.tsx
 */
class TokenOverviewPage {
  private readonly assetOptionsButton = '[data-testid="asset-options__button"]';

  private readonly backButton = '.asset-page__back-button';

  private driver: Driver;

  private readonly moreButton = '[data-testid="coin-overview-more"]';

  private readonly parentSelector =
    '[data-testid="parent-selector-asset-details"]';

  private readonly receiveButton = '[data-testid="coin-overview-receive"]';

  private readonly sendButton = {
    text: 'Send',
    css: '.icon-button',
  };

  private readonly swapButton = {
    text: 'Swap',
    css: '.icon-button',
  };

  private readonly viewAssetInExplorerButton = {
    text: 'View Asset in explorer',
    tag: 'div',
  };

  constructor(driver: Driver) {
    this.driver = driver;
  }

  async checkPageIsLoaded(): Promise<void> {
    await this.driver.waitForSelector(this.parentSelector);

    // Try send button check
    try {
      const sendButtonFound = await this.driver.waitForSelector(
        this.sendButton,
      );

      if (sendButtonFound) {
        console.log('Token overview page is loaded');
        return;
      }
    } catch (e) {
      console.log('Failed to find send button, trying swap button', e);
    }

    // Fallback to swap button check
    try {
      const swapButtonFound = await this.driver.waitForSelector(
        this.swapButton,
      );

      if (swapButtonFound) {
        console.log('Token overview page is loaded');
      }
    } catch (e) {
      console.log(
        'Timeout while waiting for Token overview page to be loaded',
        e,
      );
      throw e;
    }
  }

  async clickBack(): Promise<void> {
    await this.driver.clickElement(this.backButton);
  }

  async clickReceive(): Promise<void> {
    await this.driver.clickElement(this.moreButton);
    await this.driver.waitForSelector(this.receiveButton);
    await this.driver.clickElement(this.receiveButton);
  }

  async clickSend(): Promise<void> {
    await this.driver.clickElement(this.sendButton);
  }

  async clickSwap(): Promise<void> {
    // Default asset row: Buy / Swap / Send / Receive.
    const swapOnRow = await this.driver.isElementPresentAndVisible(
      this.swapButton,
      2000,
    );
    if (swapOnRow) {
      await this.driver.clickElement(this.swapButton);
      return;
    }

    // Perps market assets use Long / Short / Send / More, with Swap under More.
    const coinMorePresent = await this.driver.isElementPresentAndVisible(
      this.moreButton,
      2000,
    );
    if (coinMorePresent) {
      await this.driver.clickElement(this.moreButton);
      await this.driver.clickElement('[data-testid="coin-overview-more-swap"]');
      return;
    }

    await this.driver.clickElement('[data-testid="token-overview-more"]');
    await this.driver.clickElement('[data-testid="token-overview-more-swap"]');
  }

  /**
   * This method opens the asset in explorer.
   */
  async viewAssetInExplorer(): Promise<void> {
    console.log('Viewing asset in explorer');
    await this.driver.clickElement(this.assetOptionsButton);
    await this.driver.clickElementAndWaitToDisappear(
      this.viewAssetInExplorerButton,
    );
  }
}

export default TokenOverviewPage;
