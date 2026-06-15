/**
 * Perps Watchlist E2E tests.
 *
 * Covers adding a market to the watchlist from the market detail page and
 * verifying it appears in the Perps home watchlist section with a filled
 * star icon, then removing it and verifying it disappears.
 *
 * PREREQUISITE: All tests require PERPS_ENABLED=true in the extension build.
 * Set PERPS_ENABLED=true in .metamaskrc (see .metamaskrc.dist) before running locally.
 */
import { Suite } from 'mocha';
import { withFixtures } from '../../helpers';
import { Driver } from '../../webdriver/driver';
import { login } from '../../page-objects/flows/login.flow';
import { PerpsHomePage } from '../../page-objects/pages/perps/perps-home-page';
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

        const perpsHomePage = new PerpsHomePage(driver);
        await perpsHomePage.navigateToPerpsHome();
        await perpsHomePage.waitForBalanceSection();

        // Navigate to the BTC market detail page
        const marketListPage = new PerpsMarketListPage(driver);
        await marketListPage.navigateToMarketList();

        const marketDetailPage = new PerpsMarketDetailPage(driver);
        await marketDetailPage.navigateToMarket('BTC');

        // Add BTC to the watchlist
        await marketDetailPage.clickFavoriteButton();

        // Navigate back to Perps home
        await marketDetailPage.clickBack();

        // Verify the watchlist section is now visible and contains BTC
        await perpsHomePage.waitForWatchlistMarket('BTC');
      },
    );
  });

  it('removes a market from the watchlist and verifies it disappears', async function () {
    await withFixtures(
      {
        ...getPerpsConfigEligible(this.test?.fullTitle()),
        ignoredConsoleErrors: ['Value is null'],
      },
      async ({ driver }: { driver: Driver }) => {
        await login(driver);

        const perpsHomePage = new PerpsHomePage(driver);
        await perpsHomePage.navigateToPerpsHome();
        await perpsHomePage.waitForBalanceSection();

        const marketListPage = new PerpsMarketListPage(driver);
        const marketDetailPage = new PerpsMarketDetailPage(driver);

        // Add ETH to the watchlist first so the section is never fully empty
        await marketListPage.navigateToMarketList();
        await marketDetailPage.navigateToMarket('ETH');
        await marketDetailPage.clickFavoriteButton();
        await marketDetailPage.clickBack();
        await perpsHomePage.waitForWatchlistMarket('ETH');

        // Remove ETH from the watchlist
        await marketListPage.navigateToMarketList();

        await marketDetailPage.navigateToMarket('ETH');
        await marketDetailPage.clickFavoriteButton();

        // Wait for the button to reflect the unfavorited state before leaving
        await marketDetailPage.waitForFavoriteButton('unfavorited');

        // Navigate back to Perps home and verify the watchlist section is gone
        await marketDetailPage.clickBack();
        await perpsHomePage.checkWatchlistSectionGone();
      },
    );
  });

  it('adds multiple markets to the watchlist', async function () {
    await withFixtures(
      {
        ...getPerpsConfigEligible(this.test?.fullTitle()),
        ignoredConsoleErrors: ['Value is null'],
      },
      async ({ driver }: { driver: Driver }) => {
        await login(driver);

        const perpsHomePage = new PerpsHomePage(driver);
        await perpsHomePage.navigateToPerpsHome();
        await perpsHomePage.waitForBalanceSection();

        const marketListPage = new PerpsMarketListPage(driver);
        const marketDetailPage = new PerpsMarketDetailPage(driver);

        // Add ETH to watchlist
        await marketListPage.navigateToMarketList();
        await marketDetailPage.navigateToMarket('ETH');
        await marketDetailPage.clickFavoriteButton();
        await marketDetailPage.clickBack();

        // Add AVAX to watchlist
        await marketListPage.navigateToMarketList();
        await marketDetailPage.navigateToMarket('AVAX');
        await marketDetailPage.clickFavoriteButton();
        await marketDetailPage.clickBack();

        await perpsHomePage.waitForWatchlistMarket('ETH');
        await perpsHomePage.waitForWatchlistMarket('AVAX');
      },
    );
  });
});
