import { PERPS_HOME_ROUTE } from '../../../tests/perps/helpers';
import { PerpsPositionsBase } from './perps-positions-base';

/**
 * Page object for the Perps Home view (balance, positions, explore markets, tutorial).
 * Use this when the user is already on the Perps tab and you interact with the tab content.
 * For opening the Perps tab from account overview, use PerpsTabPage first (e.g. openPerpsTab), then use this page.
 *
 * @see ui/components/app/perps/perps-tab-view.tsx
 */
export class PerpsHomePage extends PerpsPositionsBase {
  private readonly addFundsButton =
    '[data-testid="perps-balance-actions-add-funds-empty"], [data-testid="perps-balance-actions-add-funds"]';

  private readonly balanceSection =
    '[data-testid="perps-balance-actions"], [data-testid="perps-balance-actions-empty"]';

  private readonly perpsHomeBackButton = {
    testId: 'perps-home-back-button',
  };

  private readonly perpsTabView = {
    testId: 'perps-tab-view',
  };

  private readonly perpsHomeSearchButton = {
    testId: 'perps-home-search-button',
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

  private readonly perpsWithdrawButton = {
    testId: 'perps-balance-actions-withdraw',
  };

  private readonly positionCardsSelector = '[data-testid^="position-card-"]';

  /**
   * Checks that the Perps Home page back button is visible.
   */
  async checkBackButtonIsVisible(): Promise<void> {
    await this.driver.waitForSelector(this.perpsHomeBackButton);
  }

  /**
   * Waits for the Perps tab view to be loaded and visible.
   */
  async checkPageIsLoaded(): Promise<void> {
    await this.driver.waitForSelector(this.perpsTabView);
  }

  /**
   * Checks that the Perps Home page search button is visible.
   */
  async checkSearchButtonIsVisible(): Promise<void> {
    await this.driver.waitForSelector(this.perpsHomeSearchButton);
  }

  /**
   * Clicks the Add funds button (visible in empty state or when balance exists).
   */
  async clickAddFunds(): Promise<void> {
    await this.driver.waitForSelector(this.addFundsButton);
    const addFundsElement = await this.driver.findElement(this.addFundsButton);
    await this.driver.scrollToElement(addFundsElement);
    await this.driver.clickElement(this.addFundsButton);
  }

  /**
   * Clicks the "Learn the basics of perps" row (opens the tutorial modal).
   */
  async clickLearnBasics(): Promise<void> {
    await this.driver.clickElement(this.perpsLearnBasics);
  }

  /**
   * Clicks the "See All" link in the Recent Activity section (navigates to Perps Activity).
   * Requires positions so Recent Activity section is visible.
   */
  async clickRecentActivitySeeAll(): Promise<void> {
    await this.driver.clickElement(this.perpsRecentActivitySeeAll);
  }

  /**
   * Clicks the search button in the header (navigates to Market List).
   */
  async clickSearchButton(): Promise<void> {
    await this.driver.clickElement(this.perpsHomeSearchButton);
  }

  /**
   * Clicks the Withdraw button (visible when account has balance).
   */
  async clickWithdraw(): Promise<void> {
    await this.driver.clickElement(this.perpsWithdrawButton);
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
    await this.driver.clickElement(this.perpsTutorialLetsGoButton);
  }

  /**
   * Navigates to the Perps Home route and waits for the page to load.
   * Uses window.location.hash so the SPA router switches view without a full page reload,
   * which keeps the extension context and avoids re-injecting the extension.
   */
  async navigateToPerpsHome(): Promise<void> {
    await this.driver.executeScript(
      `window.location.hash = '${PERPS_HOME_ROUTE}';`,
    );
    await this.checkPageIsLoaded();
  }

  /**
   * Waits for the balance section to be visible (empty or with balance).
   *
   * @param timeout - Optional timeout in ms for the selector wait.
   */
  async waitForBalanceSection(timeout?: number): Promise<void> {
    await this.driver.waitForSelector(this.balanceSection, { timeout });
  }

  /**
   * Waits up to `timeout` ms for the number of position cards to equal `expectedCount`,
   * to avoid flakiness when the UI is still updating.
   *
   * @param expectedCount - Expected number of position cards.
   * @param timeout - Max wait time in ms (default 10 000).
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
   * Waits for the Recent Activity section to be visible (when user has positions).
   */
  async waitForRecentActivitySection(): Promise<void> {
    await this.driver.waitForSelector(this.perpsRecentActivity);
  }
}
