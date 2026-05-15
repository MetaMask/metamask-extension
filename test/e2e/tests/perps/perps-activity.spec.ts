/**
 * Perps Activity E2E tests.
 *
 * Covers the Perps Activity page:
 * - Filter dropdown shows all four options (Trades, Orders, Funding, Deposits)
 * - Each filter can be selected and the active filter label changes
 * - Clicking a transaction card navigates to the market detail page
 *
 * Activity data is injected via `WS_WITH_ACTIVITY_DATA` (WebSocket mocks) combined with
 * `getPerpsConfigEligibleWithActivity` HTTP overrides for all four transaction types:
 * fills (trades), open orders, funding payments, and deposit ledger entries.
 *
 * PREREQUISITE: All tests require PERPS_ENABLED=true in the extension build.
 * Set PERPS_ENABLED=true in .metamaskrc (see .metamaskrc.dist) before running locally.
 */
import { Suite } from 'mocha';
import { withFixtures } from '../../helpers';
import { Driver } from '../../webdriver/driver';
import { login } from '../../page-objects/flows/login.flow';
import { PerpsHomePage } from '../../page-objects/pages/perps/perps-home-page';
import { PerpsActivityPage } from '../../page-objects/pages/perps/perps-activity-page';
import { PerpsMarketDetailPage } from '../../page-objects/pages/perps/perps-market-detail-page';
import { getPerpsConfigEligibleWithActivity } from './perps-fixture-config';
import { WS_WITH_ACTIVITY_DATA } from './mocks/websocketActivityMocks';

describe('Perps Activity', function (this: Suite) {
  // ─── Filter dropdown UI ────────────────────────────────────────────────────

  it('shows all four filter options in the activity filter dropdown', async function () {
    await withFixtures(
      {
        ...getPerpsConfigEligibleWithActivity(this.test?.fullTitle()),
        perpsWebSocketSpecificMocks: WS_WITH_ACTIVITY_DATA,
      },
      async ({ driver }: { driver: Driver }) => {
        await login(driver);

        const perpsHomePage = new PerpsHomePage(driver);
        await perpsHomePage.navigateToPerpsHome();
        await perpsHomePage.waitForBalanceSection();
        await perpsHomePage.clickRecentActivitySeeAll();

        const activityPage = new PerpsActivityPage(driver);
        await activityPage.checkPageIsLoaded();

        // Open the filter dropdown and verify all options are visible
        await activityPage.clickFilterButton();
        await activityPage.waitForFilterOption('trade');
        await activityPage.waitForFilterOption('order');
        await activityPage.waitForFilterOption('funding');
        await activityPage.waitForFilterOption('deposit');
      },
    );
  });

  // ─── Filter by Trades ──────────────────────────────────────────────────────

  it('filters activity by Trades and shows trade transactions', async function () {
    await withFixtures(
      {
        ...getPerpsConfigEligibleWithActivity(this.test?.fullTitle()),
        perpsWebSocketSpecificMocks: WS_WITH_ACTIVITY_DATA,
      },
      async ({ driver }: { driver: Driver }) => {
        await login(driver);

        const perpsHomePage = new PerpsHomePage(driver);
        await perpsHomePage.navigateToPerpsHome();
        await perpsHomePage.waitForBalanceSection();
        await perpsHomePage.clickRecentActivitySeeAll();

        const activityPage = new PerpsActivityPage(driver);
        await activityPage.checkPageIsLoaded();

        // Open dropdown and select Trades filter
        await activityPage.clickFilterButton();
        await activityPage.selectFilter('trade');

        // Verify trade transactions appear (ETH open-long fill injected via WS)
        await activityPage.waitForAnyTransactionCard();
        await activityPage.waitForActivityTradeTitleContaining('Opened long');
      },
    );
  });

  // ─── Filter by Orders ─────────────────────────────────────────────────────

  it('filters activity by Orders and shows order transactions', async function () {
    await withFixtures(
      {
        ...getPerpsConfigEligibleWithActivity(this.test?.fullTitle()),
        perpsWebSocketSpecificMocks: WS_WITH_ACTIVITY_DATA,
      },
      async ({ driver }: { driver: Driver }) => {
        await login(driver);

        const perpsHomePage = new PerpsHomePage(driver);
        await perpsHomePage.navigateToPerpsHome();
        await perpsHomePage.waitForBalanceSection();
        await perpsHomePage.clickRecentActivitySeeAll();

        const activityPage = new PerpsActivityPage(driver);
        await activityPage.checkPageIsLoaded();

        // Open dropdown and select Orders filter
        await activityPage.clickFilterButton();
        await activityPage.selectFilter('order');

        // Verify order transactions appear (ETH limit order injected via WS)
        await activityPage.waitForAnyTransactionCard();
      },
    );
  });

  // ─── Filter by Funding ────────────────────────────────────────────────────

  it('filters activity by Funding and shows funding transactions', async function () {
    await withFixtures(
      {
        ...getPerpsConfigEligibleWithActivity(this.test?.fullTitle()),
        perpsWebSocketSpecificMocks: WS_WITH_ACTIVITY_DATA,
      },
      async ({ driver }: { driver: Driver }) => {
        await login(driver);

        const perpsHomePage = new PerpsHomePage(driver);
        await perpsHomePage.navigateToPerpsHome();
        await perpsHomePage.waitForBalanceSection();
        await perpsHomePage.clickRecentActivitySeeAll();

        const activityPage = new PerpsActivityPage(driver);
        await activityPage.checkPageIsLoaded();

        // Open dropdown and select Funding filter
        await activityPage.clickFilterButton();
        await activityPage.selectFilter('funding');

        // Verify funding transactions appear (ETH funding payment injected via WS webData2)
        await activityPage.waitForAnyTransactionCard();
      },
    );
  });

  // ─── Filter by Deposits ───────────────────────────────────────────────────

  it('filters activity by Deposits and shows deposit transactions', async function () {
    await withFixtures(
      {
        ...getPerpsConfigEligibleWithActivity(this.test?.fullTitle()),
        perpsWebSocketSpecificMocks: WS_WITH_ACTIVITY_DATA,
      },
      async ({ driver }: { driver: Driver }) => {
        await login(driver);

        const perpsHomePage = new PerpsHomePage(driver);
        await perpsHomePage.navigateToPerpsHome();
        await perpsHomePage.waitForBalanceSection();
        await perpsHomePage.clickRecentActivitySeeAll();

        const activityPage = new PerpsActivityPage(driver);
        await activityPage.checkPageIsLoaded();

        // Open dropdown and select Deposits filter
        await activityPage.clickFilterButton();
        await activityPage.selectFilter('deposit');

        // Verify deposit transactions appear (USDC deposit injected via WS webData2)
        await activityPage.waitForAnyTransactionCard();
      },
    );
  });

  // ─── Click transaction → market detail ────────────────────────────────────

  it('clicking an order transaction navigates to the market detail page', async function () {
    await withFixtures(
      {
        ...getPerpsConfigEligibleWithActivity(this.test?.fullTitle()),
        perpsWebSocketSpecificMocks: WS_WITH_ACTIVITY_DATA,
      },
      async ({ driver }: { driver: Driver }) => {
        await login(driver);

        const perpsHomePage = new PerpsHomePage(driver);
        await perpsHomePage.navigateToPerpsHome();
        await perpsHomePage.waitForBalanceSection();
        await perpsHomePage.clickRecentActivitySeeAll();

        const activityPage = new PerpsActivityPage(driver);
        await activityPage.checkPageIsLoaded();

        // Select Orders filter and wait for an order transaction card.
        // Only order-type cards have an onClick handler that navigates to market detail.
        await activityPage.clickFilterButton();
        await activityPage.selectFilter('order');
        await activityPage.waitForAnyTransactionCard();

        // Click the first order card — navigates to the ETH market detail page
        await activityPage.clickFirstTransactionCard();

        // Verify we landed on the market detail page
        const marketDetailPage = new PerpsMarketDetailPage(driver);
        await marketDetailPage.checkPageIsLoaded();
      },
    );
  });

  // ─── Recent activity section on Perps home ────────────────────────────────

  it('recent activity section on Perps home shows a trade row', async function () {
    await withFixtures(
      {
        ...getPerpsConfigEligibleWithActivity(this.test?.fullTitle()),
        perpsWebSocketSpecificMocks: WS_WITH_ACTIVITY_DATA,
      },
      async ({ driver }: { driver: Driver }) => {
        await login(driver);

        const perpsHomePage = new PerpsHomePage(driver);
        await perpsHomePage.navigateToPerpsHome();
        await perpsHomePage.waitForBalanceSection();

        // Wait for the non-empty recent-activity section to appear
        await perpsHomePage.waitForRecentActivitySection();
      },
    );
  });
});
