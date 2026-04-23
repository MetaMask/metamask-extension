/**
 * Perps Geo-block E2E tests
 *
 * These tests verify that geo-blocked (ineligible) users see the geo-block modal
 * when attempting restricted actions (Add Funds, Long/Short, Close), and that the
 * modal can be dismissed. Eligible users should NOT see the modal.
 *
 * PREREQUISITE: All tests below require PERPS_ENABLED=true in the extension build
 * so the background PerpsController is included and can service `perpsInit` RPC calls.
 * Set PERPS_ENABLED=true in .metamaskrc (see .metamaskrc.dist) before running locally.
 */
import { Suite } from 'mocha';
import { withFixtures } from '../../helpers';
import { Driver } from '../../webdriver/driver';
import { login } from '../../page-objects/flows/login.flow';
import { PerpsHomePage } from '../../page-objects/pages/perps/perps-home-page';
import { PerpsMarketDetailPage } from '../../page-objects/pages/perps/perps-market-detail-page';
import { PerpsMarketListPage } from '../../page-objects/pages/perps/perps-market-list-page';
import { getConfig, getPerpsConfigEligible } from './helpers';

describe('Perps Geo-block', function (this: Suite) {
  this.timeout(12000000);

  // eslint-disable-next-line mocha/no-skipped-tests -- Requires PERPS_ENABLED=true in test build; see web-socket-connection.spec.ts
  it.only('shows geo-block modal when ineligible user attempts to add funds', async function () {
    await withFixtures(
      {
        // getConfig uses isEligible: false (default) — geo-blocked user
        ...getConfig(this.test?.fullTitle()),
      },
      async ({ driver }: { driver: Driver }) => {
        await login(driver, { validateBalance: false });

        const perpsHomePage = new PerpsHomePage(driver);
        await perpsHomePage.navigateToPerpsHome();

        await perpsHomePage.waitForBalanceSection();

        await perpsHomePage.clickAddFunds();
        await perpsHomePage.waitForGeoBlockModal();
      },
    );
  });

  // eslint-disable-next-line mocha/no-skipped-tests -- Requires PERPS_ENABLED=true in test build; see web-socket-connection.spec.ts
  it.skip('geo-block modal can be dismissed with Got it button', async function () {
    await withFixtures(
      {
        ...getConfig(this.test?.fullTitle()),
      },
      async ({ driver }: { driver: Driver }) => {
        await login(driver, { validateBalance: false });

        const perpsHomePage = new PerpsHomePage(driver);
        await perpsHomePage.navigateToPerpsHome();
        await perpsHomePage.waitForBalanceSection();

        await perpsHomePage.clickAddFunds();
        await perpsHomePage.waitForGeoBlockModal();
        await perpsHomePage.dismissGeoBlockModal();
        await perpsHomePage.waitForGeoBlockModalDismissed();
      },
    );
  });

  // eslint-disable-next-line mocha/no-skipped-tests -- Requires PERPS_ENABLED=true in test build; see web-socket-connection.spec.ts
  it.skip('shows geo-block modal when ineligible user clicks Long on market detail', async function () {
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
        // AVAX has no open position in default mock data — shows Long/Short buttons
        await marketDetailPage.navigateToMarket('AVAX');
        await marketDetailPage.waitForTradeCtaButtons();
        await marketDetailPage.clickLong();
        await marketDetailPage.waitForGeoBlockModal();
      },
    );
  });

  // eslint-disable-next-line mocha/no-skipped-tests -- Requires PERPS_ENABLED=true in test build; see web-socket-connection.spec.ts
  it.skip('shows geo-block modal when ineligible user clicks Short on market detail', async function () {
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
        await marketDetailPage.navigateToMarket('AVAX');
        await marketDetailPage.waitForTradeCtaButtons();
        await marketDetailPage.clickShort();
        await marketDetailPage.waitForGeoBlockModal();
      },
    );
  });

  // eslint-disable-next-line mocha/no-skipped-tests -- Requires PERPS_ENABLED=true in test build; see web-socket-connection.spec.ts
  it.skip('geo-block modal on market detail can be dismissed', async function () {
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
        await marketDetailPage.navigateToMarket('AVAX');
        await marketDetailPage.waitForTradeCtaButtons();
        await marketDetailPage.clickLong();
        await marketDetailPage.waitForGeoBlockModal();
        await marketDetailPage.dismissGeoBlockModal();
        // After dismissal the trade CTA buttons remain visible (user stays on market detail)
        await marketDetailPage.waitForTradeCtaButtons();
      },
    );
  });

  // eslint-disable-next-line mocha/no-skipped-tests -- Requires PERPS_ENABLED=true in test build; see web-socket-connection.spec.ts
  it.skip('eligible user does not see geo-block modal when clicking Add Funds', async function () {
    await withFixtures(
      {
        // getPerpsConfigEligible sets isEligible: true — no geo-block
        ...getPerpsConfigEligible(this.test?.fullTitle()),
      },
      async ({ driver }: { driver: Driver }) => {
        await login(driver, { validateBalance: false });

        const perpsHomePage = new PerpsHomePage(driver);
        await perpsHomePage.navigateToPerpsHome();
        await perpsHomePage.waitForBalanceSection();

        await perpsHomePage.clickAddFunds();
        // Eligible user should NOT see the geo-block modal — it stays absent
        await perpsHomePage.waitForGeoBlockModalDismissed();
      },
    );
  });

  // eslint-disable-next-line mocha/no-skipped-tests -- Requires PERPS_ENABLED=true in test build; see web-socket-connection.spec.ts
  it.skip('eligible user does not see geo-block modal when clicking Long', async function () {
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
        // Eligible user proceeds to the order entry — no geo-block modal
        await marketDetailPage.waitForOrderEntry();
      },
    );
  });
});
