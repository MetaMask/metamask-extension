import assert from 'node:assert/strict';
import { Suite } from 'mocha';
import { withFixtures } from '../../helpers';
import { Driver } from '../../webdriver/driver';
import { loginWithoutBalanceValidation } from '../../page-objects/flows/login.flow';
import { PerpsActivityPage } from '../../page-objects/pages/perps/perps-activity-page';
import { PerpsHomePage } from '../../page-objects/pages/perps/perps-home-page';
import { PerpsMarketDetailPage } from '../../page-objects/pages/perps/perps-market-detail-page';
import { PerpsMarketListPage } from '../../page-objects/pages/perps/perps-market-list-page';
import { getConfig } from './helpers';

/**
 * Perps E2E tests.
 *
 * Positions and orders come from mock PerpsStreamManager (ui/providers/perps/PerpsStreamManager/index.mock.ts).
 * The mock controller's placeOrder pushes the new position to the stream so the UI shows Modify/Close immediately.
 * When real PerpsController is integrated, WebSocket/HTTP mocks can be used (websocket-perps-mocks, mock-e2e).
 */
describe('Perps', function (this: Suite) {
  this.timeout(120000);

  // eslint-disable-next-line mocha/no-skipped-tests -- enable when positions list is stable
  it('shows list of open positions', async function () {
    await withFixtures(
      {
        ...getConfig(this.test?.fullTitle()),
      },
      async ({ driver }: { driver: Driver }) => {
        await loginWithoutBalanceValidation(driver);

        const perpsHomePage = new PerpsHomePage(driver);
        await perpsHomePage.navigateToPerpsHome();
        await perpsHomePage.waitForPositionsSection();

        const positionCount = await perpsHomePage.getPositionCardsCount();
        assert.ok(
          positionCount >= 1,
          `Expected at least 1 open position, got ${positionCount}`,
        );

        await perpsHomePage.waitForPositionCard('ETH');
      },
    );
  });

  it('opens order flow and submits a long market order', async function () {
    await withFixtures(
      {
        ...getConfig(this.test?.fullTitle()),
      },
      async ({ driver }: { driver: Driver }) => {
        await loginWithoutBalanceValidation(driver);

        const perpsHomePage = new PerpsHomePage(driver);
        await perpsHomePage.navigateToPerpsHome();
        await perpsHomePage.waitForPositionsSection();

        const marketDetailPage = new PerpsMarketDetailPage(driver);
        await marketDetailPage.navigateToMarket('AVAX');
        await marketDetailPage.waitForTradeCtaButtons();
        await marketDetailPage.clickLong();
        await marketDetailPage.waitForOrderEntry();
        await marketDetailPage.fillAmount('100');
        await marketDetailPage.clickSubmitOrder();
      },
    );
  });

  it('opens add funds from Perps home', async function () {
    await withFixtures(
      {
        ...getConfig(this.test?.fullTitle()),
      },
      async ({ driver }: { driver: Driver }) => {
        await loginWithoutBalanceValidation(driver);

        const perpsHomePage = new PerpsHomePage(driver);
        await perpsHomePage.navigateToPerpsHome();
        await perpsHomePage.waitForBalanceSection();
        await perpsHomePage.clickAddFunds();
        // Add funds flow not implemented yet; test verifies button is visible and clickable
        await perpsHomePage.waitForBalanceSection();
      },
    );
  });

  it('opens withdraw from Perps home', async function () {
    await withFixtures(
      {
        ...getConfig(this.test?.fullTitle()),
      },
      async ({ driver }: { driver: Driver }) => {
        await loginWithoutBalanceValidation(driver);

        const perpsHomePage = new PerpsHomePage(driver);
        await perpsHomePage.navigateToPerpsHome();
        await perpsHomePage.waitForBalanceSection();
        await perpsHomePage.clickWithdraw();
        // Withdraw flow not implemented yet; test verifies button is visible and clickable
        await perpsHomePage.waitForBalanceSection();
      },
    );
  });

  it('navigates from Perps home to Activity via recent activity See All link', async function () {
    await withFixtures(
      {
        ...getConfig(this.test?.fullTitle()),
      },
      async ({ driver }: { driver: Driver }) => {
        await loginWithoutBalanceValidation(driver);

        const perpsHomePage = new PerpsHomePage(driver);
        await perpsHomePage.navigateToPerpsHome();
        await perpsHomePage.waitForPositionsSection();
        await perpsHomePage.waitForRecentActivitySection();
        await perpsHomePage.clickRecentActivitySeeAll();

        const activityPage = new PerpsActivityPage(driver);
        await activityPage.checkPageIsLoaded();
      },
    );
  });

  it('explore crypto: search by type and sort by volume, search field', async function () {
    await withFixtures(
      {
        ...getConfig(this.test?.fullTitle()),
      },
      async ({ driver }: { driver: Driver }) => {
        await loginWithoutBalanceValidation(driver);

        const perpsHomePage = new PerpsHomePage(driver);
        await perpsHomePage.navigateToPerpsHome();
        await perpsHomePage.waitForBalanceSection();
        await perpsHomePage.clickSearchButton();

        const marketListPage = new PerpsMarketListPage(driver);
        await marketListPage.waitForPageLoaded();
        await marketListPage.waitForFilterSortRow();
        await marketListPage.selectFilter('crypto');
        await marketListPage.selectSortByVolumeHigh();
        await marketListPage.fillSearch('ETH');
      },
    );
  });

  it('learn basics of perps tutorial (go through it)', async function () {
    await withFixtures(
      {
        ...getConfig(this.test?.fullTitle()),
      },
      async ({ driver }: { driver: Driver }) => {
        await loginWithoutBalanceValidation(driver);

        const perpsHomePage = new PerpsHomePage(driver);
        await perpsHomePage.navigateToPerpsHome();
        await perpsHomePage.waitForBalanceSection();
        await perpsHomePage.clickLearnBasics();
        await perpsHomePage.goThroughTutorialModal();
      },
    );
  });

  it('Modify button visible on market with position (only checks button, like Close)', async function () {
    await withFixtures(
      {
        ...getConfig(this.test?.fullTitle()),
      },
      async ({ driver }: { driver: Driver }) => {
        await loginWithoutBalanceValidation(driver);

        const perpsHomePage = new PerpsHomePage(driver);
        await perpsHomePage.navigateToPerpsHome();
        await perpsHomePage.waitForPositionsSection();

        const marketDetailPage = new PerpsMarketDetailPage(driver);
        await marketDetailPage.navigateToMarket('ETH');
        await marketDetailPage.checkPositionCtaButtonsVisible();
        await marketDetailPage.checkModifyButtonVisible();
        await marketDetailPage.checkCloseButtonVisible();
      },
    );
  });

  // eslint-disable-next-line mocha/no-skipped-tests -- not implemented
  it.skip('Close all: position, orders', function () {
    // Not implemented: close all positions and orders flow.
  });

  // eslint-disable-next-line mocha/no-skipped-tests -- not implemented
  it.skip('Position autoclose (values get updated)', function () {
    // Not implemented: assert position autoclose and that values get updated.
  });
});
