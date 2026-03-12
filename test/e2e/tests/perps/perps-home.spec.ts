import { Suite } from 'mocha';
import { withFixtures } from '../../helpers';
import { Driver } from '../../webdriver/driver';
import { loginWithoutBalanceValidation } from '../../page-objects/flows/login.flow';
import { PerpsHomePage } from '../../page-objects/pages/perps/perps-home-page';
import { PerpsMarketDetailPage } from '../../page-objects/pages/perps/perps-market-detail-page';
import { PerpsMarketListPage } from '../../page-objects/pages/perps/perps-market-list-page';
import { getConfig } from './helpers';

/**
 * Perps E2E tests.
 *
 * Positions and orders come from mock PerpsStreamManager (ui/providers/perps/PerpsStreamManager/index.mock.ts).
 * The mock controller's placeOrder pushes the new position to the stream so the UI shows Modify/Close immediately.
 * When real PerpsController is integrated, WebSocket/HTTP mocks can be used (websocket/perps-mocks, mock-e2e).
 */
describe('Perps', function (this: Suite) {
  this.timeout(120000);

  // eslint-disable-next-line mocha/no-skipped-tests -- WebSocket mocks not yet wired for real PerpsStreamManager
  it.skip('shows list of open positions', async function () {
    await withFixtures(
      {
        ...getConfig(this.test?.fullTitle()),
      },
      async ({ driver }: { driver: Driver }) => {
        await loginWithoutBalanceValidation(driver);

        const perpsHomePage = new PerpsHomePage(driver);
        await perpsHomePage.navigateToPerpsHome();
        await perpsHomePage.waitForPositionsSection();
        await perpsHomePage.waitForPositionCardsCount(9);

        await perpsHomePage.waitForPositionCard('ETH');
      },
    );
  });

  // eslint-disable-next-line mocha/no-skipped-tests -- WebSocket mocks not yet wired for real PerpsStreamManager
  it.skip('opens order flow and submits a long market order', async function () {
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

  // eslint-disable-next-line mocha/no-skipped-tests -- WebSocket mocks not yet wired for real PerpsStreamManager
  it.skip('opens add funds from Perps home', async function () {
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

  // eslint-disable-next-line mocha/no-skipped-tests -- WebSocket mocks not yet wired for real PerpsStreamManager
  it.skip('opens withdraw from Perps home', async function () {
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

  // eslint-disable-next-line mocha/no-skipped-tests -- WebSocket mocks not yet wired for real PerpsStreamManager
  it.skip('explore crypto: search by type and sort by volume, search field', async function () {
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
        await marketListPage.checkPageIsLoaded();
        await marketListPage.waitForFilterSortRow();
        await marketListPage.selectFilter('crypto');
        await marketListPage.selectSortByVolumeHigh();
        await marketListPage.fillSearch('ETH');
      },
    );
  });

  // eslint-disable-next-line mocha/no-skipped-tests -- WebSocket mocks not yet wired for real PerpsStreamManager
  it.skip('learn basics of perps tutorial (go through it)', async function () {
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

  // eslint-disable-next-line mocha/no-skipped-tests -- WebSocket mocks not yet wired for real PerpsStreamManager
  it.skip('Modify button visible on market with position (only checks button, like Close)', async function () {
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

  // eslint-disable-next-line mocha/no-skipped-tests -- not implemented
  it.skip('navigates from Perps home to Activity via recent activity See All link', async function () {
    // Not implemented: navigates from Perps home to Activity via recent activity See All link.
  });
});
