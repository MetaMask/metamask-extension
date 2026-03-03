import { Driver } from '../../../webdriver/driver';
import { PERPS_HOME_ROUTE } from '../../../tests/perps/helpers';

/**
 * Page object for the Perps Home page.
 *
 * @see ui/pages/perps/perps-home-page.tsx
 */
export class PerpsHomePage {
  private readonly driver: Driver;

  private readonly perpsHomeBackButton = {
    testId: 'perps-home-back-button',
  };

  private readonly perpsHomePage = {
    testId: 'perps-home-page',
  };

  private readonly perpsHomeSearchButton = {
    testId: 'perps-home-search-button',
  };

  private readonly perpsPositionsSection = {
    testId: 'perps-positions-section',
  };

  private readonly positionCardsSelector = '[data-testid^="position-card-"]';

  constructor(driver: Driver) {
    this.driver = driver;
  }

  /**
   * Waits for the Perps Home page to be loaded and visible.
   */
  async checkPageIsLoaded(): Promise<void> {
    await this.driver.waitForSelector(this.perpsHomePage);
  }

  /**
   * Navigates to the Perps Home route via hash and waits for the page to load.
   */
  async navigateToPerpsHome(): Promise<void> {
    await this.driver.executeScript(
      `window.location.hash = '${PERPS_HOME_ROUTE}';`,
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
   * Checks that the Perps Home page search button is visible.
   */
  async checkSearchButtonIsVisible(): Promise<void> {
    await this.driver.waitForSelector(this.perpsHomeSearchButton);
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
   * Waits for the balance section to be visible (empty or with balance).
   * @param timeout - Optional timeout in ms for the selector wait.
   */
  async waitForBalanceSection(timeout?: number): Promise<void> {
    await this.driver.waitForSelector(
      '[data-testid="perps-balance-actions"], [data-testid="perps-balance-actions-empty"]',
      { timeout },
    );
  }

  /**
   * Clicks the Add funds button (visible in empty state or when balance exists).
   */
  async clickAddFunds(): Promise<void> {
    await this.driver.waitForSelector(
      '[data-testid="perps-balance-actions-add-funds-empty"], [data-testid="perps-balance-actions-add-funds"]',
    );
    const addFundsButton = await this.driver.findElement(
      '[data-testid="perps-balance-actions-add-funds-empty"], [data-testid="perps-balance-actions-add-funds"]',
    );
    await this.driver.scrollToElement(addFundsButton);
    await this.driver.clickElement(
      '[data-testid="perps-balance-actions-add-funds-empty"], [data-testid="perps-balance-actions-add-funds"]',
    );
  }

  /**
   * Clicks the Withdraw button (visible when account has balance).
   */
  async clickWithdraw(): Promise<void> {
    await this.driver.clickElement({
      testId: 'perps-balance-actions-withdraw',
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
   * Clicks the search button in the header (navigates to Market List).
   */
  async clickSearchButton(): Promise<void> {
    await this.driver.clickElement(this.perpsHomeSearchButton);
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
