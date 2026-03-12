import { Driver } from '../../../webdriver/driver';
import { PERPS_TAB_HASH } from '../../../tests/perps/helpers';

/**
 * Page object for the Perps tab (wallet home with perps tab selected).
 * Content merged from former PerpsHomePage into PerpsView.
 *
 * @see ui/components/app/perps/perps-view.tsx
 */
export class PerpsHomePage {
  private readonly driver: Driver;

  private readonly perpsHomeBackButton = {
    testId: 'perps-home-back-button',
  };

  private readonly perpsTabView = {
    testId: 'perps-tab-view',
  };

  private readonly perpsExploreMarketsRow = {
    testId: 'perps-explore-markets-row',
  };

  private readonly perpsPositionsSection = {
    testId: 'perps-positions-section',
  };

  private readonly positionCardsSelector = '[data-testid^="position-card-"]';

  constructor(driver: Driver) {
    this.driver = driver;
  }

  /**
   * Waits for the Perps tab view to be loaded and visible.
   */
  async checkPageIsLoaded(): Promise<void> {
    await this.driver.waitForSelector(this.perpsTabView);
  }

  /**
   * Navigates to the wallet home with Perps tab selected and waits for the tab view to load.
   */
  async navigateToPerpsHome(): Promise<void> {
    await this.driver.executeScript(
      `window.location.hash = '${PERPS_TAB_HASH}';`,
    );
    await this.checkPageIsLoaded();
  }

  /**
   * Checks that the Perps Home page back button is visible.
   */
  async checkBackButtonIsVisible(): Promise<void> {
    await this.driver.waitForSelector(this.perpsHomeBackButton);
  }

  /**
   * Checks that the Explore markets row is visible (entry point to market list).
   */
  async checkSearchButtonIsVisible(): Promise<void> {
    await this.driver.waitForSelector(this.perpsExploreMarketsRow);
  }

  /**
   * Waits for the positions section to be visible (mock positions loaded).
   */
  async waitForPositionsSection(): Promise<void> {
    await this.driver.waitForSelector(this.perpsPositionsSection);
  }

  /**
   * Waits up to `timeout` ms for the number of position cards to equal `expectedCount`,
   * to avoid flakiness when the UI is still updating.
   * @param expectedCount - Expected number of position cards.
   * @param timeout - Max wait time in ms (default 10000).
   */
  async waitForPositionCardsCount(
    expectedCount: number,
    timeout = 10000,
  ): Promise<void> {
    await this.driver.wait(async () => {
      const elements = await this.driver.findElements(
        this.positionCardsSelector,
      );
      return elements.length === expectedCount;
    }, timeout);
  }

  /**
   * Returns the number of position cards currently displayed.
   */
  async getPositionCardsCount(): Promise<number> {
    const elements = await this.driver.findElements(this.positionCardsSelector);
    return elements.length;
  }

  /**
   * Waits for a position card for the given symbol to be visible.
   * @param symbol
   */
  async waitForPositionCard(symbol: string): Promise<void> {
    await this.driver.waitForSelector({
      testId: `position-card-${symbol}`,
    });
  }

  /**
   * Waits for the balance dropdown to be visible.
   * @param timeout - Optional timeout in ms for the selector wait.
   */
  async waitForBalanceSection(timeout?: number): Promise<void> {
    await this.driver.waitForSelector(
      '[data-testid="perps-balance-dropdown"]',
      { timeout },
    );
  }

  /**
   * Clicks the Add funds button (opens balance dropdown first, then clicks Add funds).
   */
  async clickAddFunds(): Promise<void> {
    await this.driver.waitForSelector(
      '[data-testid="perps-balance-dropdown-balance"]',
    );
    await this.driver.clickElement({
      testId: 'perps-balance-dropdown-balance',
    });
    await this.driver.clickElement({
      testId: 'perps-balance-dropdown-add-funds',
    });
  }

  /**
   * Clicks the Withdraw button (opens balance dropdown first, then clicks Withdraw).
   */
  async clickWithdraw(): Promise<void> {
    await this.driver.waitForSelector(
      '[data-testid="perps-balance-dropdown-balance"]',
    );
    await this.driver.clickElement({
      testId: 'perps-balance-dropdown-balance',
    });
    await this.driver.clickElement({
      testId: 'perps-balance-dropdown-withdraw',
    });
  }

  /**
   * Clicks the "See All" link in the Recent Activity section (navigates to Perps Activity).
   * Requires positions so Recent Activity section is visible.
   */
  async clickRecentActivitySeeAll(): Promise<void> {
    await this.driver.clickElement({
      testId: 'perps-recent-activity-see-all',
    });
  }

  /**
   * Clicks the Explore markets row (navigates to Market List).
   */
  async clickSearchButton(): Promise<void> {
    await this.driver.clickElement(this.perpsExploreMarketsRow);
  }

  /**
   * Clicks the "Learn the basics of perps" row (opens the tutorial modal).
   */
  async clickLearnBasics(): Promise<void> {
    await this.driver.clickElement({ testId: 'perps-learn-basics' });
  }

  /**
   * Waits for the tutorial modal and goes through all steps (Continue x5, then Let's go).
   * clickElement uses findClickableElement and waits for the button to be visible and enabled.
   */
  async goThroughTutorialModal(): Promise<void> {
    await this.driver.waitForSelector({ testId: 'perps-tutorial-modal' });
    for (let i = 0; i < 5; i++) {
      await this.driver.clickElement({
        testId: 'perps-tutorial-continue-button',
      });
    }
    await this.driver.clickElement({
      testId: 'perps-tutorial-lets-go-button',
    });
  }

  /**
   * Waits for the Recent Activity section to be visible (when user has positions).
   */
  async waitForRecentActivitySection(): Promise<void> {
    await this.driver.waitForSelector({
      testId: 'perps-recent-activity',
    });
  }
}
