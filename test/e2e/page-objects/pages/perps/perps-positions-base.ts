import HomePage from '../home/homepage';

/**
 * Shared position-card helpers for Perps surfaces that list open positions.
 *
 * Screen: not a route by itself — mixed into `PerpsTab` (and subclasses) on
 * `#/perps` / `#/perps-home`.
 * Owns: waiting for and clicking `position-card-*` rows and size/text
 * assertions on those cards.
 * Boundaries: everything outside the positions list (balance dropdown,
 * watchlist, explore, tutorial) stays on `PerpsTab`. Navigating via
 * `clickPositionCard` hands off to `PerpsMarketDetailPage`.
 * Related: `PerpsTab` (concrete owner), `PerpsMarketDetailPage` (opened by
 * clicking a position card).
 *
 * @see ui/components/app/perps/position-card/position-card.tsx
 * @see ui/components/app/perps/perps-positions-orders/perps-positions-orders.tsx
 */
export class PerpsPositionsBase extends HomePage {
  protected readonly accountOverviewPerpsTab = {
    testId: 'account-overview__perps-tab',
  };

  protected readonly bottomNavPerpsButton = '[data-testid="bottom-nav-perps"]';

  private readonly perpsPositionsSection = {
    testId: 'perps-positions-section',
  };

  /**
   * Clicks the position card for the given symbol (navigates to market detail).
   *
   * @param symbol - The trading pair symbol (e.g. 'ETH', 'BTC').
   */
  async clickPositionCard(symbol: string): Promise<void> {
    await this.driver.clickElement({ testId: `position-card-${symbol}` });
  }

  /**
   * Waits for a position card for the given symbol to be visible.
   *
   * @param symbol - The trading pair symbol (e.g. 'ETH', 'BTC').
   */
  async waitForPositionCard(symbol: string): Promise<void> {
    await this.driver.waitForSelector({
      testId: `position-card-${symbol}`,
    });
  }

  /**
   * Waits until the position card for `symbol` contains the given text fragment
   * (e.g. size row "2.25 ETH" or leverage/direction "3x short").
   *
   * @param symbol - Asset symbol (e.g. 'ETH', 'BTC').
   * @param textFragment - Substring that must appear in the card text.
   */
  async waitForPositionCardContains(
    symbol: string,
    textFragment: string,
  ): Promise<void> {
    await this.driver.waitForSelector({
      testId: `position-card-${symbol}`,
      text: textFragment,
    });
  }

  /**
   * Waits until the position card for `symbol` shows the given size line
   * (e.g. "2.25 ETH" on the Perps home positions list).
   *
   * @param symbol - Asset symbol (e.g. 'ETH').
   * @param sizeLabel - Size row text as shown on the card (e.g. '2.25 ETH').
   */
  async waitForPositionCardSize(
    symbol: string,
    sizeLabel: string,
  ): Promise<void> {
    await this.waitForPositionCardContains(symbol, sizeLabel);
  }

  /**
   * Waits for the positions section to be visible (mock positions loaded).
   */
  async waitForPositionsSection(): Promise<void> {
    await this.driver.waitForSelector(this.perpsPositionsSection);
  }
}
