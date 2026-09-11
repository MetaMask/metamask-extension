import { Driver } from '../../../webdriver/driver';
import { readResolvedAssetActionsLayout } from './asset-actions-layout';

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

  /**
   * Opens Receive from the current action layout. On a zero-balance Perps row
   * Receive is a primary button; otherwise it lives in More.
   */
  async clickReceive(): Promise<void> {
    const layout = await readResolvedAssetActionsLayout(this.driver);

    if (layout.type === 'perps') {
      const rowReceive = `[data-testid="${layout.prefix}-overview-receive"]`;
      const receiveOnRow = await this.driver.isElementPresentAndVisible(
        rowReceive,
        250,
      );

      if (receiveOnRow) {
        await this.driver.clickElement(rowReceive);
        return;
      }

      await this.driver.clickElement(
        `[data-testid="${layout.prefix}-overview-more"]`,
      );
      await this.driver.clickElement(
        `[data-testid="${layout.prefix}-overview-more-receive"]`,
      );
      return;
    }

    await this.driver.clickElement(this.moreButton);
    await this.driver.waitForSelector(this.receiveButton);
    await this.driver.clickElement(this.receiveButton);
  }

  async clickSend(): Promise<void> {
    await this.driver.clickElement(this.sendButton);
  }

  async clickSwap(): Promise<void> {
    const layout = await readResolvedAssetActionsLayout(this.driver);

    if (layout.type === 'standard') {
      await this.driver.clickElement(this.swapButton);
      return;
    }

    // Buy and Swap move into the More menu when the Perps row takes over.
    await this.driver.clickElement(
      `[data-testid="${layout.prefix}-overview-more"]`,
    );
    await this.driver.clickElement(
      `[data-testid="${layout.prefix}-overview-more-swap"]`,
    );
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
