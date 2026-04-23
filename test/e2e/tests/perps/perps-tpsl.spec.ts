/**
 * Perps Take Profit / Stop Loss E2E tests
 *
 * Tests covering the full TP/SL (auto-close) feature:
 * - Setting TP/SL during new order entry
 * - Validation errors for invalid TP/SL prices
 * - Updating TP/SL on an existing position
 * - Auto-close row visibility on market detail when TP/SL is set
 *
 * PREREQUISITE: All tests require PERPS_ENABLED=true in the extension build.
 * Set PERPS_ENABLED=true in .metamaskrc (see .metamaskrc.dist) before running locally.
 *
 * Tests that update TP/SL on an existing position use perpsWebSocketSpecificMocks
 * to inject position data. See mocks/websocketPositionMocks.ts.
 */
import { Suite } from 'mocha';
import { withFixtures } from '../../helpers';
import { Driver } from '../../webdriver/driver';
import { login } from '../../page-objects/flows/login.flow';
import { PerpsHomePage } from '../../page-objects/pages/perps/perps-home-page';
import { PerpsMarketDetailPage } from '../../page-objects/pages/perps/perps-market-detail-page';
import { PerpsMarketListPage } from '../../page-objects/pages/perps/perps-market-list-page';
import { PerpsOrderEntryPage } from '../../page-objects/pages/perps/perps-order-entry-page';
import { getPerpsConfigEligible } from './helpers';
import {
  WS_USER_WITH_ETH_LONG,
  WS_USER_WITH_ETH_LONG_AND_TPSL,
} from './mocks/websocketPositionMocks';

describe('Perps Take Profit / Stop Loss', function (this: Suite) {
  this.timeout(120000);

  // ─── TP/SL during new order entry ─────────────────────────────────────────

  // eslint-disable-next-line mocha/no-skipped-tests -- Requires PERPS_ENABLED=true in test build; see web-socket-connection.spec.ts
  it.skip('sets take profit during long order entry and submits successfully', async function () {
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

        const orderEntryPage = new PerpsOrderEntryPage(driver);
        await orderEntryPage.checkPageIsLoaded();
        await orderEntryPage.fillAmount('100');

        // Enable auto-close and set a take profit above current price ($25)
        await orderEntryPage.enableAutoClose();
        await orderEntryPage.fillTpPrice('40.00');

        await orderEntryPage.submitOrder();

        // After submission, the auto-close row should be visible on market detail
        await marketDetailPage.checkPageIsLoaded();
        await marketDetailPage.checkPositionCtaButtonsVisible();
        await marketDetailPage.waitForAutoCloseRow();
      },
    );
  });

  // eslint-disable-next-line mocha/no-skipped-tests -- Requires PERPS_ENABLED=true in test build; see web-socket-connection.spec.ts
  it.skip('sets stop loss during long order entry and submits successfully', async function () {
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

        const orderEntryPage = new PerpsOrderEntryPage(driver);
        await orderEntryPage.checkPageIsLoaded();
        await orderEntryPage.fillAmount('100');

        // Enable auto-close and set a stop loss below current price ($25)
        await orderEntryPage.enableAutoClose();
        await orderEntryPage.fillSlPrice('18.00');

        await orderEntryPage.submitOrder();

        await marketDetailPage.checkPageIsLoaded();
        await marketDetailPage.checkPositionCtaButtonsVisible();
        await marketDetailPage.waitForAutoCloseRow();
      },
    );
  });

  // eslint-disable-next-line mocha/no-skipped-tests -- Requires PERPS_ENABLED=true in test build; see web-socket-connection.spec.ts
  it.skip('sets both take profit and stop loss during order entry', async function () {
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

        const orderEntryPage = new PerpsOrderEntryPage(driver);
        await orderEntryPage.checkPageIsLoaded();
        await orderEntryPage.fillAmount('100');

        await orderEntryPage.enableAutoClose();
        // TP above current price, SL below current price (AVAX ~$25)
        await orderEntryPage.fillTpPrice('40.00');
        await orderEntryPage.fillSlPrice('18.00');

        await orderEntryPage.submitOrder();

        await marketDetailPage.checkPageIsLoaded();
        await marketDetailPage.checkPositionCtaButtonsVisible();
        await marketDetailPage.waitForAutoCloseRow();
      },
    );
  });

  // eslint-disable-next-line mocha/no-skipped-tests -- Requires PERPS_ENABLED=true in test build; see web-socket-connection.spec.ts
  it.skip('sets TP/SL for a short order — SL above entry, TP below entry', async function () {
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
        await marketDetailPage.clickShort();

        const orderEntryPage = new PerpsOrderEntryPage(driver);
        await orderEntryPage.checkPageIsLoaded();
        await orderEntryPage.fillAmount('100');

        await orderEntryPage.enableAutoClose();
        // For a short: TP is BELOW current price, SL is ABOVE current price
        await orderEntryPage.fillTpPrice('18.00');
        await orderEntryPage.fillSlPrice('35.00');

        await orderEntryPage.submitOrder();

        await marketDetailPage.checkPageIsLoaded();
        await marketDetailPage.checkPositionCtaButtonsVisible();
        await marketDetailPage.waitForAutoCloseRow();
      },
    );
  });

  // ─── TP/SL validation errors ───────────────────────────────────────────────

  // eslint-disable-next-line mocha/no-skipped-tests -- Requires PERPS_ENABLED=true in test build; see web-socket-connection.spec.ts
  it.skip('shows TP validation error when take profit price is below current price for a long', async function () {
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

        const orderEntryPage = new PerpsOrderEntryPage(driver);
        await orderEntryPage.checkPageIsLoaded();
        await orderEntryPage.fillAmount('100');
        await orderEntryPage.enableAutoClose();
        // For a long, TP must be ABOVE current price — $10 is invalid for AVAX ~$25
        await orderEntryPage.fillTpPrice('10.00');
        await orderEntryPage.waitForTpValidationError();
      },
    );
  });

  // eslint-disable-next-line mocha/no-skipped-tests -- Requires PERPS_ENABLED=true in test build; see web-socket-connection.spec.ts
  it.skip('shows SL validation error when stop loss price is above current price for a long', async function () {
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

        const orderEntryPage = new PerpsOrderEntryPage(driver);
        await orderEntryPage.checkPageIsLoaded();
        await orderEntryPage.fillAmount('100');
        await orderEntryPage.enableAutoClose();
        // For a long, SL must be BELOW current price — $50 is invalid for AVAX ~$25
        await orderEntryPage.fillSlPrice('50.00');
        await orderEntryPage.waitForSlValidationError();
      },
    );
  });

  // ─── Updating TP/SL on an existing position ───────────────────────────────

  // eslint-disable-next-line mocha/no-skipped-tests -- Requires PERPS_ENABLED=true in test build; see web-socket-connection.spec.ts
  it.skip('auto-close row is visible on market detail when position has TP/SL set', async function () {
    await withFixtures(
      {
        ...getPerpsConfigEligible(this.test?.fullTitle()),
        perpsWebSocketSpecificMocks: WS_USER_WITH_ETH_LONG_AND_TPSL,
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
        // Auto-close row should be visible since position has TP=$3200 and SL=$2600
        await marketDetailPage.waitForAutoCloseRow();
      },
    );
  });

  // eslint-disable-next-line mocha/no-skipped-tests -- Requires PERPS_ENABLED=true in test build; see web-socket-connection.spec.ts
  it.skip('opens TP/SL update modal by clicking the auto-close row', async function () {
    await withFixtures(
      {
        ...getPerpsConfigEligible(this.test?.fullTitle()),
        perpsWebSocketSpecificMocks: WS_USER_WITH_ETH_LONG_AND_TPSL,
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
        await marketDetailPage.waitForAutoCloseRow();

        // Clicking the auto-close row opens the TP/SL update modal
        await marketDetailPage.clickAutoCloseRow();
        await marketDetailPage.waitForUpdateTpslModal();

        // The modal shows the estimated TP PnL row
        await marketDetailPage.waitForTpslModalEstimatedTpPnlRow();
      },
    );
  });

  // eslint-disable-next-line mocha/no-skipped-tests -- Requires PERPS_ENABLED=true in test build; see web-socket-connection.spec.ts
  it.skip('updates take profit price on an existing ETH long position', async function () {
    await withFixtures(
      {
        ...getPerpsConfigEligible(this.test?.fullTitle()),
        perpsWebSocketSpecificMocks: WS_USER_WITH_ETH_LONG_AND_TPSL,
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
        await marketDetailPage.waitForAutoCloseRow();

        await marketDetailPage.clickAutoCloseRow();
        await marketDetailPage.waitForUpdateTpslModal();

        // Update TP to a new price above current ETH price (~$3000)
        await marketDetailPage.fillTpPriceInTpslModal('3500.00');

        await marketDetailPage.submitTpslUpdate();
        // After update the modal closes and the auto-close row remains
        await marketDetailPage.waitForAutoCloseRow();
      },
    );
  });

  // eslint-disable-next-line mocha/no-skipped-tests -- Requires PERPS_ENABLED=true in test build; see web-socket-connection.spec.ts
  it.skip('updates stop loss price on an existing ETH long position', async function () {
    await withFixtures(
      {
        ...getPerpsConfigEligible(this.test?.fullTitle()),
        perpsWebSocketSpecificMocks: WS_USER_WITH_ETH_LONG_AND_TPSL,
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
        await marketDetailPage.waitForAutoCloseRow();

        await marketDetailPage.clickAutoCloseRow();
        await marketDetailPage.waitForUpdateTpslModal();

        // Update SL to a lower price below current ETH price (~$3000)
        await marketDetailPage.fillSlPriceInTpslModal('2400.00');

        await marketDetailPage.submitTpslUpdate();
        await marketDetailPage.waitForAutoCloseRow();
      },
    );
  });

  // eslint-disable-next-line mocha/no-skipped-tests -- Requires PERPS_ENABLED=true in test build; see web-socket-connection.spec.ts
  it.skip('adds TP/SL to an existing ETH long position that has no auto-close', async function () {
    await withFixtures(
      {
        ...getPerpsConfigEligible(this.test?.fullTitle()),
        // ETH long without TP/SL set
        perpsWebSocketSpecificMocks: WS_USER_WITH_ETH_LONG,
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

        // Without TP/SL, auto-close row shows a CTA to add it — click it to open update modal
        await marketDetailPage.clickAutoCloseRow();
        await marketDetailPage.waitForUpdateTpslModal();

        // Set TP and SL
        await marketDetailPage.fillTpPriceInTpslModal('3500.00');
        await marketDetailPage.fillSlPriceInTpslModal('2400.00');

        await marketDetailPage.submitTpslUpdate();
        await marketDetailPage.checkPositionCtaButtonsVisible();
      },
    );
  });
});
