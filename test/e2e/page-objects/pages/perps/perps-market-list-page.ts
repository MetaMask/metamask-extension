import { Driver } from '../../../webdriver/driver';

/**
 * Page object for the Perps Market List (search / explore crypto).
 *
 * @see ui/pages/perps/market-list/index.tsx
 */
export class PerpsMarketListPage {
  private readonly driver: Driver;

  private readonly exploreMarketsRow = {
    testId: 'perps-explore-markets-row',
  };

  private readonly filterOption = (optionId: string) => {
    return {
      xpath: `//*[@data-testid='filter-select-button'][contains(normalize-space(.), '${optionId}')]`,
    };
  };

  private readonly filterSelectButton = { testId: 'filter-select-button' };

  private readonly filterSortRow = { testId: 'market-list-filter-sort-row' };

  private readonly headerBackButton = { testId: 'back-button' };

  private readonly marketListView = { testId: 'market-list-view' };

  private readonly marketRow = {
    xpath: "//*[starts-with(@data-testid,'market-row-')]",
  };

  /**
   * Perps toast close control. Dismissing avoids click intercept when the banner
   * overlays Explore markets after favoriting.
   *
   * @see ui/components/multichain/toast/toast.tsx
   */
  private readonly perpsToastCloseButton =
    '[data-testid="perps-toast-banner-base"] .mm-banner-base__close-button';

  /** CSS selector for the search input; driver.fill() expects a string locator. */
  private readonly searchInput = '[data-testid="search-input"]';

  private readonly sortDropdownButton = { testId: 'sort-dropdown-button' };

  private readonly sortOptionVolumeHigh = {
    testId: 'sort-dropdown-option-volumeHigh',
  };

  private readonly sortOptionVolumeLow = {
    testId: 'sort-dropdown-option-volumeLow',
  };

  constructor(driver: Driver) {
    this.driver = driver;
  }

  /**
   * Waits for the market list view to be visible.
   * Uses multiple selectors for robustness (convention).
   */
  async checkPageIsLoaded(): Promise<void> {
    await this.driver.waitForMultipleSelectors([
      this.filterSortRow,
      this.marketListView,
    ]);
  }

  /**
   * Clicks the market list header back control (`navigate(-1)`), typically returning to Perps home.
   */
  async clickBack(): Promise<void> {
    await this.driver.clickElementAndWaitToDisappear(this.headerBackButton);
  }

  /**
   * Fills the search input with the given query.
   *
   * @param query
   */
  async fillSearch(query: string): Promise<void> {
    await this.driver.waitForSelector(this.searchInput);
    await this.driver.fill(this.searchInput, query);
  }

  /**
   * Returns the selector for a filter dropdown option (e.g. 'all', 'crypto').
   *
   * @param optionId - The filter option id (e.g. 'all', 'crypto').
   */
  private getFilterOptionSelector(optionId: string): { testId: string } {
    return { testId: `filter-select-option-${optionId}` };
  }

  /**
   * Navigates to the Perps Market List by clicking the "Explore markets" row.
   * Requires the Perps Home view to be visible (e.g. after navigateToPerpsHome()).
   * Dismisses any visible toast that may cover the row, waits for the row to stop
   * moving (watchlist mount / toast dismiss can shift layout), then clicks with
   * {@link Driver.clickElement}.
   */
  async navigateToMarketList(): Promise<void> {
    await this.driver.waitForSelector(this.exploreMarketsRow);
    await this.driver.clickElementSafe(this.perpsToastCloseButton, 2000);
    await this.driver.waitForElementToStopMoving(this.exploreMarketsRow);
    await this.driver.clickElement(this.exploreMarketsRow);
    await this.checkPageIsLoaded();
  }

  /**
   * Selects a filter by type (e.g. 'crypto', 'all').
   * Opens the filter dropdown and clicks the option.
   *
   * @param optionId - 'all' | 'crypto' | 'stock' | 'commodity' | 'forex' | 'new'
   */
  async selectFilter(optionId: string): Promise<void> {
    await this.driver.waitForSelector(this.filterSelectButton);
    await this.driver.clickElement(this.filterSelectButton);
    await this.driver.clickElement(this.getFilterOptionSelector(optionId));
  }

  /**
   * Selects sort by volume high to low.
   * Opens the sort dropdown and clicks the volumeHigh option.
   */
  async selectSortByVolumeHigh(): Promise<void> {
    await this.driver.waitForSelector(this.sortDropdownButton);
    await this.driver.clickElement(this.sortDropdownButton);
    await this.driver.clickElement(this.sortOptionVolumeHigh);
  }

  /**
   * Selects sort by volume low to high.
   */
  async selectSortByVolumeLow(): Promise<void> {
    await this.driver.waitForSelector(this.sortDropdownButton);
    await this.driver.clickElement(this.sortDropdownButton);
    await this.driver.clickElement(this.sortOptionVolumeLow);
  }

  /**
   * Waits for at least one market row to be visible in the list.
   * Market rows have data-testid="market-row-{SYMBOL}" (e.g. market-row-BTC).
   */
  async waitForAnyMarketRow(): Promise<void> {
    await this.driver.waitForSelector(this.marketRow);
  }

  /**
   * Waits for the filter dropdown button to show the given label (e.g. "All", "Crypto", "Stocks").
   *
   * @param label - Expected visible label on the filter button.
   */
  async waitForFilterLabel(label: string): Promise<void> {
    await this.driver.waitForSelector(this.filterOption(label));
  }

  /**
   * Waits for the filter/sort row to be visible (hidden when search has text).
   */
  async waitForFilterSortRow(): Promise<void> {
    await this.driver.waitForSelector(this.filterSortRow);
  }
}
