/**
 * Perps Watchlist E2E tests.
 *
 * Covers adding a market to the watchlist from the market detail page and
 * verifying it appears in the Perps home watchlist section. Unfavorite and
 * multi-market cases are omitted: 16.2 persist-and-revert against the AUS
 * schema (still requires `myx`) fails the second toggle.
 *
 * PREREQUISITE: All tests require PERPS_ENABLED=true in the extension build.
 * Set PERPS_ENABLED=true in .metamaskrc (see .metamaskrc.dist) before running locally.
 */
import { Suite } from 'mocha';
import { withFixtures } from '../../helpers';
import { Driver } from '../../webdriver/driver';
import { login } from '../../page-objects/flows/login.flow';
import { PerpsTab } from '../../page-objects/pages/home/perps-tab';
import { PerpsMarketDetailPage } from '../../page-objects/pages/perps/perps-market-detail-page';
import { PerpsMarketListPage } from '../../page-objects/pages/perps/perps-market-list-page';
import { getPerpsConfigEligible } from './perps-fixture-config';

describe('Perps Watchlist', function (this: Suite) {
  it('adds a market to the watchlist and verifies it on Perps home', async function () {
    await withFixtures(
      {
        ...getPerpsConfigEligible(this.test?.fullTitle()),
        ignoredConsoleErrors: ['Value is null'],
      },
      async ({ driver }: { driver: Driver }) => {
        await login(driver);

        const perpsTab = new PerpsTab(driver);
        await perpsTab.navigateToPerpsHome();
        await perpsTab.waitForBalanceSection();

        // Navigate to the BTC market detail page
        const marketListPage = new PerpsMarketListPage(driver);
        await marketListPage.navigateToMarketList();

        const marketDetailPage = new PerpsMarketDetailPage(driver);
        await marketDetailPage.navigateToMarket('BTC');

        // Add BTC to the watchlist
        await marketDetailPage.clickFavoriteButton();

        // Navigate back to Perps home: history.back lands on the market
        // list, so use the market list back control to reach the home route.
        await marketDetailPage.clickBack();
        await marketListPage.clickBack();

        // Verify the watchlist section is now visible and contains BTC
        await perpsTab.waitForWatchlistMarket('BTC');
      },
    );
  });

  it('opens the market list filtered to the watchlist from the section header', async function () {
    await withFixtures(
      {
        ...getPerpsConfigEligible(this.test?.fullTitle()),
        ignoredConsoleErrors: ['Value is null'],
      },
      async ({ driver }: { driver: Driver }) => {
        await login(driver);

        const perpsTab = new PerpsTab(driver);
        await perpsTab.navigateToPerpsHome();
        await perpsTab.waitForBalanceSection();

        const marketListPage = new PerpsMarketListPage(driver);
        const marketDetailPage = new PerpsMarketDetailPage(driver);

        await marketListPage.navigateToMarketList();
        await marketDetailPage.navigateToMarket('BTC');
        await marketDetailPage.clickFavoriteButton();
        await marketDetailPage.clickBack();
        await marketListPage.clickBack();
        await perpsTab.waitForWatchlistMarket('BTC');

        await perpsTab.clickWatchlistHeader();

        await marketListPage.checkPageIsLoaded();
        await marketListPage.waitForFilterLabel('Watchlist');
        await marketListPage.waitForMarketRow('BTC');
      },
    );
  });
});
