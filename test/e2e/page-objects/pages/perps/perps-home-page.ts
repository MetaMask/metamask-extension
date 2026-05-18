import { PerpsPositionsBase } from './perps-positions-base';

/**
 * Page object for the Perps tab (wallet home with Perps tab selected).
 * Use this when the user is already on the Perps tab and interacting with
 * balance, positions, explore markets, and tutorial content.
 * For opening the Perps tab from account overview, use PerpsTabPage first.
 *
 * @see ui/components/app/perps/perps-view.tsx
 */
export class PerpsHomePage extends PerpsPositionsBase {
  private readonly addFundsButton = {
    testId: 'perps-balance-dropdown-add-funds',
  };

  private readonly balanceDropdownBalanceRow = {
    testId: 'perps-balance-dropdown-balance',
  };

  private readonly balanceDropdownWithdraw = {
    testId: 'perps-balance-dropdown-withdraw',
  };

  private readonly geoBlockModal = { testId: 'perps-geo-block-modal' };

  private readonly geoBlockModalDismiss = {
    testId: 'perps-geo-block-modal-dismiss',
  };

  private readonly perpsBalanceDropdown = {
    testId: 'perps-balance-dropdown',
  };

  private readonly perpsExploreMarketsRow = {
    testId: 'perps-explore-markets-row',
  };

  private readonly perpsLearnBasics = { testId: 'perps-learn-basics' };

  private readonly perpsRecentActivity = { testId: 'perps-recent-activity' };

  private readonly perpsRecentActivitySeeAll = {
    testId: 'perps-recent-activity-see-all',
  };

  private readonly perpsTutorialContinueButton = {
    testId: 'perps-tutorial-continue-button',
  };

  private readonly perpsTutorialLetsGoButton = {
    testId: 'perps-tutorial-lets-go-button',
  };

  private readonly perpsTutorialModal = { testId: 'perps-tutorial-modal' };

  private readonly perpsView = {
    testId: 'perps-view',
  };

  private readonly perpsRecentActivityEmpty = {
    testId: 'perps-recent-activity-empty',
  };

  private readonly perpsWatchlist = { testId: 'perps-watchlist' };

  private readonly perpsWatchlistMarket = (symbol: string) => {
    return {
      testId: `perps-watchlist-${symbol}`,
    };
  };

  private readonly positionCardsSelector = '[data-testid^="position-card-"]';

  /**
   * Waits for the Perps Home view to be loaded and visible.
   * The main Perps tab shows PerpsView (balance dropdown, positions, explore).
   */
  async checkPageIsLoaded(): Promise<void> {
    await this.driver.waitForMultipleSelectors(
      [this.perpsView, this.perpsBalanceDropdown],
      { timeout: 20000 },
    );
  }

  /**
   * Clicks the Add funds button. On Perps Home the balance is in a dropdown:
   * opens the dropdown first, then clicks Add funds.
   */
  async clickAddFunds(): Promise<void> {
    await this.driver.clickElement(this.balanceDropdownBalanceRow);
    await this.driver.clickElement(this.addFundsButton);
  }

  /**
   * Clicks the "Explore markets" row (navigates to Perps Market List).
   */
  async clickExploreMarketsRow(): Promise<void> {
    await this.driver.clickElement(this.perpsExploreMarketsRow);
  }

  /**
   * Clicks the "Learn the basics of perps" row (opens the tutorial modal).
   */
  async clickLearnBasics(): Promise<void> {
    await this.driver.clickElement(this.perpsLearnBasics);
  }

  /**
   * Clicks the "See All" link in the Recent Activity section (navigates to Perps Activity).
   * Shown for both the populated list header and the empty-state header.
   */
  async clickRecentActivitySeeAll(): Promise<void> {
    await this.driver.clickElement(this.perpsRecentActivitySeeAll);
  }

  /**
   * Clicks the Withdraw button. On Perps Home the balance is in a dropdown:
   * opens the dropdown first, then clicks Withdraw.
   */
  async clickWithdraw(): Promise<void> {
    await this.driver.clickElement(this.balanceDropdownBalanceRow);
    await this.driver.clickElement(this.balanceDropdownWithdraw);
  }

  /**
   * Waits for the tutorial modal and goes through all steps (Continue x5, then Let's go).
   * clickElement uses findClickableElement and waits for the button to be visible and enabled.
   */
  async goThroughTutorialModal(): Promise<void> {
    await this.driver.waitForSelector(this.perpsTutorialModal);
    for (let i = 0; i < 5; i++) {
      await this.driver.clickElement(this.perpsTutorialContinueButton);
    }
    await this.driver.clickElementAndWaitToDisappear(
      this.perpsTutorialLetsGoButton,
    );
  }

  /**
   * Navigates to Perps Home by clicking the Perps tab on the account overview.
   * Requires the account overview to be visible (e.g. after login or driver.navigate()).
   * Waits for the Perps tab to be present, clicks it, then waits for the Perps Home view to load.
   */
  async navigateToPerpsHome(): Promise<void> {
    await this.driver.waitForSelector(this.accountOverviewPerpsTab);
    await this.driver.clickElement(this.accountOverviewPerpsTab);
    await this.checkPageIsLoaded();
  }

  /**
   * Waits for the balance section to be visible (empty or with balance).
   */
  async waitForBalanceSection(): Promise<void> {
    await this.driver.waitForSelector(this.perpsBalanceDropdown);
  }

  /**
   * Waits for the "Explore markets" row to be visible on the Perps home.
   */
  async waitForExploreMarketsRow(): Promise<void> {
    await this.driver.waitForSelector(this.perpsExploreMarketsRow);
  }

  /**
   * Waits until the number of position cards equals `expectedCount` (uses waitUntil to avoid race conditions).
   *
   * @param expectedCount - Expected number of position cards.
   * @param timeout - Max wait time in ms (default 10 000).
   */
  async waitForPositionCardsCount(
    expectedCount: number,
    timeout = 10000,
  ): Promise<void> {
    await this.driver.waitUntil(
      async () => {
        const elements = await this.driver.findElements(
          this.positionCardsSelector,
        );
        return elements.length === expectedCount;
      },
      { timeout, interval: 500 },
    );
  }

  /**
   * Waits for the Recent Activity list (non-empty) to be visible.
   * When there is no history, the section uses `perps-recent-activity-empty` instead.
   */
  async waitForRecentActivitySection(): Promise<void> {
    await this.driver.waitForSelector(this.perpsRecentActivity);
  }

  /**
   * Dismisses the geo-block modal by clicking the "Got it" button.
   */
  async dismissGeoBlockModal(): Promise<void> {
    await this.driver.clickElementAndWaitToDisappear(this.geoBlockModalDismiss);
  }

  /**
   * Waits for the geo-block modal to be visible.
   * The modal appears when an ineligible (geo-blocked) user attempts a restricted action.
   */
  async waitForGeoBlockModal(): Promise<void> {
    await this.driver.waitForSelector(this.geoBlockModal);
  }

  /**
   * Waits for the geo-block modal to be absent (dismissed or not yet triggered).
   */
  async waitForGeoBlockModalDismissed(): Promise<void> {
    await this.driver.assertElementNotPresent(this.geoBlockModal);
  }

  /**
   * Waits for the empty activity state to be visible.
   * Shown when the user has no perps transaction history.
   */
  async waitForEmptyActivitySection(): Promise<void> {
    await this.driver.waitForSelector(this.perpsRecentActivityEmpty);
  }

  /**
   * Waits for a specific market to appear in the watchlist section.
   *
   * @param symbol - Market symbol, e.g. 'ETH'.
   */
  async waitForWatchlistMarket(symbol: string): Promise<void> {
    await this.driver.waitForSelector(this.perpsWatchlistMarket(symbol));
  }

  /**
   * Asserts that a market is NOT present in the watchlist section.
   *
   * @param symbol - Market symbol, e.g. 'ETH'.
   */
  async checkMarketNotInWatchlist(symbol: string): Promise<void> {
    await this.driver.assertElementNotPresent(
      this.perpsWatchlistMarket(symbol),
      { waitAtLeastGuard: 1000 },
    );
  }

  /**
   * Asserts that the watchlist section is completely absent from the DOM.
   * The section renders null when there are no watched markets.
   */
  async checkWatchlistSectionGone(): Promise<void> {
    await this.driver.assertElementNotPresent(this.perpsWatchlist, {
      waitAtLeastGuard: 1000,
    });
  }
}
