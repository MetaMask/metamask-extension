/**
 * Perps Navigation E2E tests
 *
 * These tests cover the Perps tab visibility, home page loading, market list,
 * market detail navigation, and the first-time user tutorial flow.
 *
 * PREREQUISITE: Most tests below require PERPS_ENABLED=true in the extension build
 * so the background PerpsController is included and can service `perpsInit` RPC calls.
 * Set PERPS_ENABLED=true in .metamaskrc (see .metamaskrc.dist) before running locally.
 * The WebSocket mock server is started automatically by helpers.js for all tests.
 *
 * Tests that do NOT require PERPS_ENABLED are marked with "(no build flag required)".
 */
import { Suite } from 'mocha';
import FixtureBuilderV2 from '../../fixtures/fixture-builder-v2';
import { withFixtures } from '../../helpers';
import { Driver } from '../../webdriver/driver';
import { login } from '../../page-objects/flows/login.flow';
import { PerpsHomePage } from '../../page-objects/pages/perps/perps-home-page';
import { PerpsMarketDetailPage } from '../../page-objects/pages/perps/perps-market-detail-page';
import { PerpsMarketListPage } from '../../page-objects/pages/perps/perps-market-list-page';
import { PerpsTabPage } from '../../page-objects/pages/perps/perps-tab-page';
import { getConfig, getPerpsConfigEligible } from './helpers';

describe('Perps Navigation', function (this: Suite) {
  this.timeout(120000);

  /**
   * (no build flag required)
   * When perpsEnabledVersion is disabled (production default: { enabled: false }),
   * getIsPerpsExperienceAvailable() returns false and the Perps tab is hidden.
   */
  it.skip('hides Perps tab when perpsEnabledVersion feature flag is disabled', async function () {
    await withFixtures(
      {
        // No manifestFlags override → uses production default (perpsEnabledVersion.enabled: false)
        fixtures: new FixtureBuilderV2().build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await login(driver, { validateBalance: false });

        const perpsTabPage = new PerpsTabPage(driver);
        await perpsTabPage.waitForAccountOverviewLoaded();
        await driver.assertElementNotPresent(
          { testId: 'account-overview__perps-tab' },
          { waitAtLeastGuard: 1000 },
        );
      },
    );
  });

  // eslint-disable-next-line mocha/no-skipped-tests -- Requires PERPS_ENABLED=true in test build; see web-socket-connection.spec.ts
  it.skip('shows Perps tab when perpsEnabledVersion feature flag is enabled', async function () {
    await withFixtures(
      {
        ...getConfig(this.test?.fullTitle()),
      },
      async ({ driver }: { driver: Driver }) => {
        await login(driver, { validateBalance: false });

        const perpsTabPage = new PerpsTabPage(driver);
        await perpsTabPage.waitForAccountOverviewLoaded();
        await driver.waitForSelector({ testId: 'account-overview__perps-tab' });
      },
    );
  });

  // eslint-disable-next-line mocha/no-skipped-tests -- Requires PERPS_ENABLED=true in test build; see web-socket-connection.spec.ts
  it.skip('perps home page loads and shows balance section', async function () {
    await withFixtures(
      {
        ...getConfig(this.test?.fullTitle()),
      },
      async ({ driver }: { driver: Driver }) => {
        await login(driver, { validateBalance: false });

        const perpsHomePage = new PerpsHomePage(driver);
        await perpsHomePage.navigateToPerpsHome();
        await perpsHomePage.waitForBalanceSection();
      },
    );
  });

  // eslint-disable-next-line mocha/no-skipped-tests -- Requires PERPS_ENABLED=true in test build; see web-socket-connection.spec.ts
  it.skip('perps home shows empty activity section when no trade history', async function () {
    await withFixtures(
      {
        ...getConfig(this.test?.fullTitle()),
      },
      async ({ driver }: { driver: Driver }) => {
        await login(driver, { validateBalance: false });

        const perpsHomePage = new PerpsHomePage(driver);
        await perpsHomePage.navigateToPerpsHome();
        await perpsHomePage.waitForEmptyActivitySection();
      },
    );
  });

  // eslint-disable-next-line mocha/no-skipped-tests -- Requires PERPS_ENABLED=true in test build; see web-socket-connection.spec.ts
  it.skip('navigates from Perps home to market list', async function () {
    await withFixtures(
      {
        ...getConfig(this.test?.fullTitle()),
      },
      async ({ driver }: { driver: Driver }) => {
        await login(driver, { validateBalance: false });

        const perpsHomePage = new PerpsHomePage(driver);
        await perpsHomePage.navigateToPerpsHome();
        await perpsHomePage.waitForBalanceSection();

        const marketListPage = new PerpsMarketListPage(driver);
        await marketListPage.navigateToMarketList();
        await marketListPage.waitForFilterSortRow();
      },
    );
  });

  // eslint-disable-next-line mocha/no-skipped-tests -- Requires PERPS_ENABLED=true in test build; see web-socket-connection.spec.ts
  it.skip('market list can filter markets by category', async function () {
    await withFixtures(
      {
        ...getConfig(this.test?.fullTitle()),
      },
      async ({ driver }: { driver: Driver }) => {
        await login(driver, { validateBalance: false });

        const perpsHomePage = new PerpsHomePage(driver);
        await perpsHomePage.navigateToPerpsHome();
        await perpsHomePage.waitForBalanceSection();

        const marketListPage = new PerpsMarketListPage(driver);
        await marketListPage.navigateToMarketList();
        await marketListPage.waitForFilterSortRow();
        await marketListPage.selectFilter('crypto');
        // Filter sort row remains visible after selecting a category filter
        await marketListPage.waitForFilterSortRow();
      },
    );
  });

  // eslint-disable-next-line mocha/no-skipped-tests -- Requires PERPS_ENABLED=true in test build; see web-socket-connection.spec.ts
  it.skip('market list can sort markets by volume high to low', async function () {
    await withFixtures(
      {
        ...getConfig(this.test?.fullTitle()),
      },
      async ({ driver }: { driver: Driver }) => {
        await login(driver, { validateBalance: false });

        const perpsHomePage = new PerpsHomePage(driver);
        await perpsHomePage.navigateToPerpsHome();
        await perpsHomePage.waitForBalanceSection();

        const marketListPage = new PerpsMarketListPage(driver);
        await marketListPage.navigateToMarketList();
        await marketListPage.waitForFilterSortRow();
        await marketListPage.selectSortByVolumeHigh();
        // Filter sort row remains visible after sorting
        await marketListPage.waitForFilterSortRow();
      },
    );
  });

  // eslint-disable-next-line mocha/no-skipped-tests -- Requires PERPS_ENABLED=true in test build; see web-socket-connection.spec.ts
  it.only('market list search field accepts input and hides filter/sort row', async function () {
    await withFixtures(
      {
        ...getConfig(this.test?.fullTitle()),
      },
      async ({ driver }: { driver: Driver }) => {
        await login(driver, { validateBalance: false });

        const perpsHomePage = new PerpsHomePage(driver);
        await perpsHomePage.navigateToPerpsHome();
        await perpsHomePage.waitForBalanceSection();

        const marketListPage = new PerpsMarketListPage(driver);
        await marketListPage.navigateToMarketList();
        await marketListPage.waitForFilterSortRow();
        // Typing in the search field hides the filter/sort row
        await marketListPage.fillSearch('BTC');
        await driver.assertElementNotPresent(
          { testId: 'market-list-filter-sort-row' },
          { waitAtLeastGuard: 500 },
        );
      },
    );
  });

  // eslint-disable-next-line mocha/no-skipped-tests -- Requires PERPS_ENABLED=true in test build and position data from WebSocket
  it.skip('market detail shows Modify and Close buttons for a market with an open position', async function () {
    await withFixtures(
      {
        ...getConfig(this.test?.fullTitle()),
        // perpsWebSocketSpecificMocks: [...] — configure user subscription to return ETH position
      },
      async ({ driver }: { driver: Driver }) => {
        await login(driver, { validateBalance: false });

        const perpsHomePage = new PerpsHomePage(driver);
        await perpsHomePage.navigateToPerpsHome();
        await perpsHomePage.waitForPositionsSection();

        const marketListPage = new PerpsMarketListPage(driver);
        await marketListPage.navigateToMarketList();

        const marketDetailPage = new PerpsMarketDetailPage(driver);
        await marketDetailPage.navigateToMarket('ETH');
        await marketDetailPage.checkPositionCtaButtonsVisible();
        await marketDetailPage.checkModifyButtonVisible();
        await marketDetailPage.checkCloseButtonVisible();
      },
    );
  });

  // eslint-disable-next-line mocha/no-skipped-tests -- Requires PERPS_ENABLED=true in test build; see web-socket-connection.spec.ts
  it.skip('market detail shows Long and Short buttons for a market without an open position', async function () {
    await withFixtures(
      {
        ...getConfig(this.test?.fullTitle()),
      },
      async ({ driver }: { driver: Driver }) => {
        await login(driver, { validateBalance: false });

        const perpsHomePage = new PerpsHomePage(driver);
        await perpsHomePage.navigateToPerpsHome();
        await perpsHomePage.waitForBalanceSection();

        const marketListPage = new PerpsMarketListPage(driver);
        await marketListPage.navigateToMarketList();

        const marketDetailPage = new PerpsMarketDetailPage(driver);
        // AVAX has no position in the default mock data
        await marketDetailPage.navigateToMarket('AVAX');
        await marketDetailPage.waitForTradeCtaButtons();
      },
    );
  });

  // eslint-disable-next-line mocha/no-skipped-tests -- Requires PERPS_ENABLED=true in test build; see web-socket-connection.spec.ts
  it.skip('submits a long market order for a market with no open position', async function () {
    await withFixtures(
      {
        ...getPerpsConfigEligible(this.test?.fullTitle()),
      },
      async ({ driver }: { driver: Driver }) => {
        await login(driver, { validateBalance: false });

        const perpsHomePage = new PerpsHomePage(driver);
        await perpsHomePage.navigateToPerpsHome();
        await perpsHomePage.waitForBalanceSection();

        const marketListPage = new PerpsMarketListPage(driver);
        await marketListPage.navigateToMarketList();

        const marketDetailPage = new PerpsMarketDetailPage(driver);
        await marketDetailPage.navigateToMarket('AVAX');
        await marketDetailPage.waitForTradeCtaButtons();
        await marketDetailPage.clickLong();
        await marketDetailPage.waitForOrderEntry();
        await marketDetailPage.fillAmount('100');
        await marketDetailPage.clickSubmitOrder();
        // After order submission, the position CTA buttons (Modify/Close) should appear
        await marketDetailPage.checkPositionCtaButtonsVisible();
      },
    );
  });

  // eslint-disable-next-line mocha/no-skipped-tests -- Requires PERPS_ENABLED=true in test build; see web-socket-connection.spec.ts
  it.skip('tutorial modal auto-opens for a first-time user and can be completed', async function () {
    await withFixtures(
      {
        // Use default fixture (isFirstTimeUser.mainnet: true) so tutorial auto-opens
        fixtures: new FixtureBuilderV2().build(),
        title: this.test?.fullTitle(),
        manifestFlags: {
          remoteFeatureFlags: {
            perpsEnabledVersion: { enabled: true, minimumVersion: '0.0.0' },
          },
        },
      },
      async ({ driver }: { driver: Driver }) => {
        await login(driver, { validateBalance: false });

        const perpsHomePage = new PerpsHomePage(driver);
        await perpsHomePage.navigateToPerpsHome();
        // Tutorial modal opens automatically because isFirstTimeUser.mainnet is true
        await perpsHomePage.goThroughTutorialModal();
        // After completing the tutorial, the main view is accessible
        await perpsHomePage.waitForBalanceSection();
      },
    );
  });
});
