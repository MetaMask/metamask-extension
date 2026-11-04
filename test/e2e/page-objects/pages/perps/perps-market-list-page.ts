import { Driver } from '../../../webdriver/driver';

/**
 * The Perps Market List: search, filter/sort, and picking a market to open.
 *
 * Screen: `#/perps/market-list`, reached from `PerpsTab.clickExploreMarketsRow`.
 * Owns: the market list view, category rail / watchlist filter, sort controls,
 * market rows, dismissing the perps toast that can intercept clicks, and header back.
 * Boundaries: selecting a row only navigates — market detail interactions
 * belong to `PerpsMarketDetailPage`. Toast content beyond the close control
 * is out of scope.
 * Related: `PerpsTab` (how tests get here), `PerpsMarketDetailPage` (opened
 * by choosing a market row).
 *
 * @see ui/pages/perps/market-list/index.tsx
 */
export class PerpsMarketListPage {
  /**
   * The category is in force either as a pressed pill on the rail, or — when it
   * overflowed — as the `More` trigger whose accessible name says it holds the
   * selection ("More, Forex selected"). One union locator, so the wait does not
   * have to know which side of the fit boundary the category landed on.
   *
   * @param optionId - Category id, as it appears in the pill test id.
   * @param label - Category display label, as it appears in the trigger's name.
   */
  private readonly categoryFilterActive = (
    optionId: string,
    label: string,
  ) => ({
    xpath:
      `//*[@data-testid='market-list-categories-pill-${optionId}' and @aria-pressed='true']` +
      ` | //*[@data-testid='market-list-categories-more-button' and @aria-label='More, ${label} selected']`,
  });

  /** Overflow menu for categories that do not fit the rail at popup width. */
  private readonly categoryMoreButton = {
    testId: 'market-list-categories-more-button',
  };

  private readonly categoryMoreOption = (optionId: string) => ({
    testId: `market-list-categories-more-option-${optionId}`,
  });

  private readonly categoryPill = (optionId: string) => ({
    testId: `market-list-categories-pill-${optionId}`,
  });

  private readonly driver: Driver;

  private readonly exploreMarketsRow = {
    testId: 'perps-explore-markets-row',
  };

  private readonly filterSortRow = { testId: 'market-list-filter-sort-row' };

  private readonly headerBackButton = { testId: 'back-button' };

  private readonly marketRow = {
    xpath: "//*[starts-with(@data-testid,'market-row-')]",
  };

  private readonly parentSelector = {
    testId: 'parent-selector-perps-market-list',
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

  /** Header icon that reveals the search box; the input is not mounted until pressed. */
  private readonly searchToggle = { testId: 'market-list-search-toggle' };

  private readonly sortDropdownButton = { testId: 'sort-dropdown-button' };

  private readonly sortOptionVolumeHigh = {
    testId: 'sort-dropdown-option-volumeHigh',
  };

  private readonly sortOptionVolumeLow = {
    testId: 'sort-dropdown-option-volumeLow',
  };

  private readonly watchlistFilterActive = {
    xpath:
      "//*[@data-testid='market-list-watchlist-toggle' and @aria-pressed='true']",
  };

  constructor(webDriver: Driver) {
    this.driver = webDriver;
  }

  /**
   * Waits for the market list view to be visible.
   * Uses multiple selectors for robustness (convention).
   */
  async checkPageIsLoaded(): Promise<void> {
    await this.driver.waitForMultipleSelectors([
      this.filterSortRow,
      this.parentSelector,
    ]);
  }

  /**
   * Clicks the market list header back control (`navigate(-1)`), typically returning to Perps home.
   */
  async clickBack(): Promise<void> {
    await this.driver.clickElementAndWaitToDisappear(this.headerBackButton);
  }

  /**
   * Fills the search input with the given query, opening the box first.
   *
   * Search sits behind the header icon rather than always occupying a row, so
   * the input is not in the DOM until the toggle is pressed.
   *
   * @param query
   */
  async fillSearch(query: string): Promise<void> {
    if (
      !(await this.driver.isElementPresentAndVisible(this.searchInput, 1000))
    ) {
      await this.driver.clickElement(this.searchToggle);
    }
    await this.driver.waitForSelector(this.searchInput);
    await this.driver.fill(this.searchInput, query);
  }

  async isPageLoaded(timeout = 2000): Promise<boolean> {
    return this.driver.isElementPresentAndVisible(this.parentSelector, timeout);
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
   * Selects a market category, from the rail or from its overflow menu.
   *
   * The rail keeps one row and measures whatever does not fit into a `More`
   * menu, so a later category is unmounted at popup width and has to be reached
   * through that menu instead.
   *
   * @param optionId - 'crypto' | 'stock' | 'commodity' | 'forex' | 'new' | …
   */
  async selectFilter(optionId: string): Promise<void> {
    const pill = this.categoryPill(optionId);
    if (await this.driver.isElementPresentAndVisible(pill, 2000)) {
      await this.driver.clickElement(pill);
      return;
    }

    await this.driver.waitForSelector(this.categoryMoreButton);
    await this.driver.clickElement(this.categoryMoreButton);
    await this.driver.clickElement(this.categoryMoreOption(optionId));
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
   * Waits until the list reflects the expected filter.
   *
   * Watchlist uses the header star toggle. A category is pressed on the rail, or
   * — if it overflowed at this width — on the `More` trigger that holds it.
   *
   * @param label - 'Watchlist' or a category label such as 'Crypto'.
   */
  async waitForFilterLabel(label: string): Promise<void> {
    if (label === 'Watchlist') {
      await this.driver.waitForSelector(this.watchlistFilterActive);
      return;
    }

    const optionIdByLabel: Record<string, string> = {
      Crypto: 'crypto',
      Memecoins: 'memecoin',
      Stocks: 'stock',
      Commodities: 'commodity',
      Forex: 'forex',
    };
    const optionId = optionIdByLabel[label];
    if (!optionId) {
      throw new Error(`Unsupported filter label for category rail: ${label}`);
    }

    // An overflowed category is not on the rail at all: the More trigger names
    // it instead, so either is proof the filter is in force.
    await this.driver.waitForSelector(
      this.categoryFilterActive(optionId, label),
    );
  }

  /**
   * Waits for the filter/sort row to be visible (hidden when search has text).
   */
  async waitForFilterSortRow(): Promise<void> {
    await this.driver.waitForSelector(this.filterSortRow);
  }

  /**
   * Waits for a specific market row to be visible in the list.
   *
   * @param symbol - Market symbol, e.g. 'BTC'.
   */
  async waitForMarketRow(symbol: string): Promise<void> {
    await this.driver.waitForSelector({ testId: `market-row-${symbol}` });
  }
}
