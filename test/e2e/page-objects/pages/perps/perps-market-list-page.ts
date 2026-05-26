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

  private readonly filterSelectButton = { testId: 'filter-select-button' };

  private readonly filterSortRow = { testId: 'market-list-filter-sort-row' };

  private readonly marketListView = { testId: 'market-list-view' };

  /** CSS selector for the search input; driver.fill() expects a string locator. */
  private readonly searchInput = '[data-testid="search-input"]';

  private readonly sortDropdownButton = { testId: 'sort-dropdown-button' };

  private readonly sortOptionVolumeHigh = {
    testId: 'sort-dropdown-option-volumeHigh',
  };

  private readonly sortOptionVolumeLow = {
    testId: 'sort-dropdown-option-volumeLow',
  };

  /**
   * Returns the selector for a filter dropdown option (e.g. 'all', 'crypto').
   *
   * @param optionId - The filter option id (e.g. 'all', 'crypto').
   */
  private getFilterOptionSelector(optionId: string): { testId: string } {
    return { testId: `filter-select-option-${optionId}` };
  }

  constructor(driver: Driver) {
    this.driver = driver;
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
   * Navigates to the Perps Market List by clicking the "Explore markets" row.
   * Requires the Perps Home view to be visible (e.g. after navigateToPerpsHome()).
   * Dismisses any visible toast first so it does not intercept the click; then uses
   * clickElementUsingMouseMove for the row to avoid ElementClickInterceptedError.
   */
  async navigateToMarketList(): Promise<void> {
    await this.driver.waitForSelector(this.exploreMarketsRow);
    await this.driver.clickElementUsingMouseMove(this.exploreMarketsRow);
    await this.checkPageIsLoaded();
  }

  /**
   * Selects a filter by type (e.g. 'crypto', 'all').
   * Opens the filter dropdown and clicks the option.
   *
   * @param optionId - 'all' | 'crypto' | 'stocks' | 'commodities' | 'forex' | 'new'
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
   * Waits for the filter/sort row to be visible (hidden when search has text).
   */
  async waitForFilterSortRow(): Promise<void> {
    await this.driver.waitForSelector(this.filterSortRow);
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
}
