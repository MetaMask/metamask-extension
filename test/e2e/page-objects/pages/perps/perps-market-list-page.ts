import { Driver } from '../../../webdriver/driver';
import { PERPS_MARKET_LIST_ROUTE } from '../../../tests/perps/helpers';

/**
 * Page object for the Perps Market List (search / explore crypto).
 *
 * @see ui/pages/perps/market-list/index.tsx
 */
export class PerpsMarketListPage {
  private readonly driver: Driver;

  private readonly filterSelectButton = { testId: 'filter-select-button' };

  private readonly filterSortRow = { testId: 'market-list-filter-sort-row' };

  private readonly marketListView = { testId: 'market-list-view' };

  private readonly searchInput = { testId: 'search-input' };

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
   * Fills the search input with the given query.
   *
   * @param query
   */
  async fillSearch(query: string): Promise<void> {
    await this.driver.waitForSelector(this.searchInput);
    await this.driver.fill(this.searchInput, query);
  }

  /**
   * Navigates to the Perps Market List route and waits for the page to load.
   * Uses window.location.hash so the SPA router switches view without a full page reload,
   * which keeps the extension context and avoids re-injecting the extension.
   */
  async navigateToMarketList(): Promise<void> {
    await this.driver.executeScript(
      `window.location.hash = '${PERPS_MARKET_LIST_ROUTE}';`,
    );
    await this.waitForPageLoaded();
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
    await this.driver.clickElement({ testId: `filter-select-option-${optionId}` });
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
   */
  async waitForPageLoaded(): Promise<void> {
    await this.driver.waitForSelector(this.marketListView);
  }
}
