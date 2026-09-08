import { Driver } from '../../../webdriver/driver';

/**
 * Which action row the asset overview currently renders. `prefix` mirrors the
 * `classPrefix` the UI passes to the buttons: `coin` for the native overview,
 * `token` for the token overview.
 */
type ActionsLayout =
  | { type: 'perps'; prefix: 'coin' | 'token' }
  | { type: 'standard' };

const ACTIONS_LAYOUT_TIMEOUT_MS = 15000;

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

  private readonly perpsActionsSkeleton =
    '[data-testid="asset-perps-actions-skeleton"]';

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
    const layout = await this.readResolvedActionsLayout();

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
   * Reads the action row currently rendered, or `null` while neither layout is
   * visible.
   */
  private async readActionsLayout(): Promise<ActionsLayout | null> {
    for (const prefix of ['coin', 'token'] as const) {
      const hasLong = await this.driver.isElementPresentAndVisible(
        `[data-testid="${prefix}-overview-long"]`,
        250,
      );
      if (hasLong) {
        return { type: 'perps', prefix };
      }
    }

    const hasSwap = await this.driver.isElementPresentAndVisible(
      this.swapButton,
      250,
    );
    return hasSwap ? { type: 'standard' } : null;
  }

  /**
   * Waits for the async Perps market and position lookups to resolve, then
   * reads the action row once.
   *
   * The asset page renders `asset-perps-actions-skeleton` while those lookups
   * are pending and only then commits to Perps or standard actions, so the row
   * cannot flip under a caller and no layout-stability polling is needed.
   */
  private async readResolvedActionsLayout(): Promise<ActionsLayout> {
    await this.driver.assertElementNotPresent(this.perpsActionsSkeleton, {
      findElementGuard: this.parentSelector,
      timeout: ACTIONS_LAYOUT_TIMEOUT_MS,
    });

    let layout: ActionsLayout | null = null;

    await this.driver.waitUntil(
      async () => {
        layout = await this.readActionsLayout();
        return layout !== null;
      },
      { timeout: ACTIONS_LAYOUT_TIMEOUT_MS, interval: 250 },
    );

    if (!layout) {
      throw new Error('Asset action buttons did not render a known layout.');
    }

    return layout;
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
