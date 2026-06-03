/**
 * Perps Position Lifecycle E2E tests
 *
 * Tests covering the full lifecycle of a perpetuals position:
 * opening, modifying exposure, closing (partial and full),
 * reversing direction, margin management, and (where a close or partial close
 * is simulated) Perps Activity shows the corresponding trade row after a `userFills` snapshot.
 *
 * PREREQUISITE: All tests require PERPS_ENABLED=true in the extension build.
 * Set PERPS_ENABLED=true in .metamaskrc (see .metamaskrc.dist) before running locally.
 *
 * Tests that require a pre-existing position (Close, Reverse, Add/Reduce Exposure,
 * Margin management) use perpsWebSocketSpecificMocks to inject position data via
 * the Hyperliquid user subscription. See mocks/websocketPositionMocks.ts.
 */
import { Suite } from 'mocha';
import { withFixtures } from '../../helpers';
import WebSocketRegistry from '../../websocket/registry';
import { WEBSOCKET_SERVICES } from '../../websocket/constants';
import { Driver } from '../../webdriver/driver';
import { login } from '../../page-objects/flows/login.flow';
import { PerpsHomePage } from '../../page-objects/pages/perps/perps-home-page';
import { PerpsMarketDetailPage } from '../../page-objects/pages/perps/perps-market-detail-page';
import { PerpsMarketListPage } from '../../page-objects/pages/perps/perps-market-list-page';
import { PerpsActivityPage } from '../../page-objects/pages/perps/perps-activity-page';
import { PerpsOrderEntryPage } from '../../page-objects/pages/perps/perps-order-entry-page';
import { assertPerpsActivityShowsCloseFill } from '../../page-objects/flows/perps-activity-close-fill.flow';
import { getPerpsConfigEligible } from './perps-fixture-config';
import {
  WS_USER_WITH_BTC_SHORT_POSITION,
  WS_USER_WITH_ETH_LONG_POSITION,
  WS_USER_WITH_FUNDED_ACCOUNT,
  pushPositionUpdate,
  pushPositionClosed,
  pushUserFillsClosePositionSnapshot,
} from './mocks/websocketPositionMocks';

describe('Perps Position Lifecycle', function (this: Suite) {
  this.timeout(10 * 60 * 1000);

  // ─── Open position flows ───────────────────────────────────────────────────

  it('opens a long market order then closes the position', async function () {
    await withFixtures(
      {
        ...getPerpsConfigEligible(this.test?.fullTitle()),
        perpsWebSocketSpecificMocks: WS_USER_WITH_FUNDED_ACCOUNT,
      },
      async ({ driver }: { driver: Driver }) => {
        await login(driver);

        const perpsHomePage = new PerpsHomePage(driver);
        await perpsHomePage.navigateToPerpsHome();
        await perpsHomePage.waitForBalanceSection();

        const marketListPage = new PerpsMarketListPage(driver);
        await marketListPage.navigateToMarketList();

        const marketDetailPage = new PerpsMarketDetailPage(driver);
        // AVAX has no position in default mock data
        await marketDetailPage.navigateToMarket('AVAX');

        await marketDetailPage.waitForTradeCtaButtons();

        await marketDetailPage.clickLong();

        const orderEntryPage = new PerpsOrderEntryPage(driver);
        await orderEntryPage.submitOrder('100');

        // Simulate the HyperLiquid WS subscription push that arrives after order fill
        const perpsServer = WebSocketRegistry.getServer(
          WEBSOCKET_SERVICES.perps,
        );
        pushPositionUpdate(perpsServer, {
          coin: 'AVAX',
          szi: '4.0',
          entryPx: '25.05',
          leverage: 10,
          positionValue: '100.20',
          accountValue: '10000.0',
          totalMarginUsed: '10.02',
          withdrawable: '9989.98',
        });

        // After order submission the market detail reloads with position CTA buttons
        await marketDetailPage.checkPageIsLoaded();
        await marketDetailPage.checkPositionCtaButtonsVisible();

        // ─── Close the position ─────────────────────────────────────────
        await marketDetailPage.closePosition();

        // Simulate the HyperLiquid WS push with zero positions after close fill
        pushPositionClosed(perpsServer);

        // After full close the trade CTA buttons (Long / Short) should reappear
        await marketDetailPage.waitForTradeCtaButtons();

        await assertPerpsActivityShowsCloseFill({
          driver,
          pushUserFills: () =>
            pushUserFillsClosePositionSnapshot(perpsServer, {
              coin: 'AVAX',
              px: '25.05',
              sz: '4.0',
              side: 'A',
              dir: 'Close Long',
              startPosition: '4.0',
              oid: 4_010_001,
              tid: 4_010_002,
            }),
          expectedTitleContains: 'Closed long',
        });
      },
    );
  });

  it('opens a short market order then closes the position', async function () {
    await withFixtures(
      {
        ...getPerpsConfigEligible(this.test?.fullTitle()),
        perpsWebSocketSpecificMocks: WS_USER_WITH_FUNDED_ACCOUNT,
      },
      async ({ driver }: { driver: Driver }) => {
        await login(driver);

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
        await orderEntryPage.submitOrder('100');

        const perpsServer = WebSocketRegistry.getServer(
          WEBSOCKET_SERVICES.perps,
        );
        pushPositionUpdate(perpsServer, {
          coin: 'AVAX',
          szi: '-4.0',
          entryPx: '25.05',
          leverage: 10,
          positionValue: '100.20',
          accountValue: '10000.0',
          totalMarginUsed: '10.02',
          withdrawable: '9989.98',
        });

        await marketDetailPage.checkPageIsLoaded();
        await marketDetailPage.checkPositionCtaButtonsVisible();

        // ─── Close the position ─────────────────────────────────────────
        await marketDetailPage.closePosition();

        pushPositionClosed(perpsServer);

        await marketDetailPage.waitForTradeCtaButtons();

        await assertPerpsActivityShowsCloseFill({
          driver,
          pushUserFills: () =>
            pushUserFillsClosePositionSnapshot(perpsServer, {
              coin: 'AVAX',
              px: '25.05',
              sz: '4.0',
              side: 'B',
              dir: 'Close Short',
              startPosition: '-4.0',
              oid: 4_011_001,
              tid: 4_011_002,
            }),
          expectedTitleContains: 'Closed short',
        });
      },
    );
  });

  // ─── Close position flows ──────────────────────────────────────────────────

  it('partially closes 50% of an existing ETH long position from the homepage', async function () {
    await withFixtures(
      {
        ...getPerpsConfigEligible(this.test?.fullTitle()),
        perpsWebSocketSpecificMocks: WS_USER_WITH_ETH_LONG_POSITION,
      },
      async ({ driver }: { driver: Driver }) => {
        await login(driver);

        const perpsHomePage = new PerpsHomePage(driver);
        await perpsHomePage.navigateToPerpsHome();
        await perpsHomePage.waitForPositionsSection();
        await perpsHomePage.waitForPositionCard('ETH');

        await perpsHomePage.clickPositionCard('ETH');

        const marketDetailPage = new PerpsMarketDetailPage(driver);
        await marketDetailPage.checkPageIsLoaded();
        await marketDetailPage.checkPositionCtaButtonsVisible();

        await marketDetailPage.closePosition(50);

        const perpsServer = WebSocketRegistry.getServer(
          WEBSOCKET_SERVICES.perps,
        );
        pushPositionUpdate(perpsServer, {
          coin: 'ETH',
          szi: '1.25',
          entryPx: '2850.00',
          leverage: 3,
          positionValue: '3562.5',
          accountValue: '11687.5',
          totalMarginUsed: '1187.5',
          withdrawable: '10500.0',
        });

        await marketDetailPage.checkPositionCtaButtonsVisible();
        await marketDetailPage.checkPositionSizeValue('1.25 ETH');
        await marketDetailPage.checkPositionLeverage('Long 3x');

        await assertPerpsActivityShowsCloseFill({
          driver,
          pushUserFills: () =>
            pushUserFillsClosePositionSnapshot(perpsServer, {
              coin: 'ETH',
              px: '2850.0',
              sz: '1.25',
              side: 'A',
              dir: 'Close Long',
              startPosition: '2.5',
              oid: 5_010_001,
              tid: 5_010_002,
            }),
          expectedTitleContains: 'Closed long',
        });

        const activityPageAfterPartial = new PerpsActivityPage(driver);
        await activityPageAfterPartial.clickHeaderBack();
        await perpsHomePage.navigateToPerpsHome();
        await perpsHomePage.waitForPositionsSection();
        await perpsHomePage.waitForPositionCardSize('ETH', '1.25 ETH');
      },
    );
  });

  it('reduces exposure (partial close) via Modify menu on an ETH long position', async function () {
    await withFixtures(
      {
        ...getPerpsConfigEligible(this.test?.fullTitle()),
        perpsWebSocketSpecificMocks: WS_USER_WITH_ETH_LONG_POSITION,
      },
      async ({ driver }: { driver: Driver }) => {
        await login(driver);

        const perpsHomePage = new PerpsHomePage(driver);
        await perpsHomePage.navigateToPerpsHome();
        await perpsHomePage.waitForPositionsSection();
        await perpsHomePage.waitForPositionCard('ETH');

        await perpsHomePage.clickPositionCard('ETH');

        const marketDetailPage = new PerpsMarketDetailPage(driver);
        await marketDetailPage.checkPageIsLoaded();
        await marketDetailPage.checkPositionCtaButtonsVisible();

        await marketDetailPage.clickModify();
        await marketDetailPage.clickModifyMenuReduceExposure();

        await marketDetailPage.confirmCloseModal(10);

        const perpsServer = WebSocketRegistry.getServer(
          WEBSOCKET_SERVICES.perps,
        );
        pushPositionUpdate(perpsServer, {
          coin: 'ETH',
          szi: '2.25',
          entryPx: '2850.00',
          leverage: 3,
          positionValue: '6412.5',
          accountValue: '12637.5',
          totalMarginUsed: '2137.5',
          withdrawable: '10500.0',
        });

        await marketDetailPage.checkPositionCtaButtonsVisible();
        await marketDetailPage.checkPositionSizeValue('2.25 ETH');
        await marketDetailPage.checkPositionLeverage('Long 3x');

        await assertPerpsActivityShowsCloseFill({
          driver,
          pushUserFills: () =>
            pushUserFillsClosePositionSnapshot(perpsServer, {
              coin: 'ETH',
              px: '2850.0',
              sz: '0.25',
              side: 'A',
              dir: 'Close Long',
              startPosition: '2.5',
              oid: 5_020_001,
              tid: 5_020_002,
            }),
          expectedTitleContains: 'Closed long',
        });

        const activityPageAfterReduce = new PerpsActivityPage(driver);
        await activityPageAfterReduce.clickHeaderBack();
        await perpsHomePage.navigateToPerpsHome();
        await perpsHomePage.waitForPositionsSection();
        await perpsHomePage.waitForPositionCardSize('ETH', '2.25 ETH');
      },
    );
  });

  it('adds exposure to an existing ETH long position via Modify menu', async function () {
    await withFixtures(
      {
        ...getPerpsConfigEligible(this.test?.fullTitle()),
        perpsWebSocketSpecificMocks: WS_USER_WITH_ETH_LONG_POSITION,
        ignoredConsoleErrors: ['Value is null'],
      },
      async ({ driver }: { driver: Driver }) => {
        await login(driver);

        const perpsHomePage = new PerpsHomePage(driver);
        await perpsHomePage.navigateToPerpsHome();
        await perpsHomePage.waitForPositionsSection();
        await perpsHomePage.waitForPositionCard('ETH');
        await perpsHomePage.clickPositionCard('ETH');

        const marketDetailPage = new PerpsMarketDetailPage(driver);
        await marketDetailPage.checkPageIsLoaded();
        await marketDetailPage.checkPositionCtaButtonsVisible();

        await marketDetailPage.clickModify();
        await marketDetailPage.clickModifyMenuAddExposure();

        const orderEntryPage = new PerpsOrderEntryPage(driver);
        await orderEntryPage.submitOrder('200');

        const perpsServer = WebSocketRegistry.getServer(
          WEBSOCKET_SERVICES.perps,
        );
        pushPositionUpdate(perpsServer, {
          coin: 'ETH',
          szi: '2.5667',
          entryPx: '2850.00',
          leverage: 3,
          positionValue: '7700.1',
          accountValue: '12950.0',
          totalMarginUsed: '2564.0',
          withdrawable: '10386.0',
        });

        await marketDetailPage.checkPageIsLoaded();
        await marketDetailPage.checkPositionCtaButtonsVisible();
        await marketDetailPage.checkPositionSizeValue('2.5667 ETH');
        await marketDetailPage.checkPositionLeverage('Long 3x');
        await marketDetailPage.clickBack();
        await perpsHomePage.navigateToPerpsHome();
        await perpsHomePage.waitForPositionsSection();
        await perpsHomePage.waitForPositionCardSize('ETH', '2.5667 ETH');
      },
    );
  });

  // ─── Reverse position flows ────────────────────────────────────────────────

  // Skipped: broken by @metamask/perps-controller v4.0.0 (commit 447247748c).
  // TradingService.flipPosition() no longer passes entryPrice as currentPrice, so
  // validateOrder() fails with ORDER_PRICE_REQUIRED inside the background service worker.
  // Requires an upstream fix in @metamask/perps-controller to resolve.
  // eslint-disable-next-line mocha/no-skipped-tests
  it.skip('reverses an ETH long position to short via Modify menu', async function () {
    await withFixtures(
      {
        ...getPerpsConfigEligible(this.test?.fullTitle()),
        perpsWebSocketSpecificMocks: WS_USER_WITH_ETH_LONG_POSITION,
      },
      async ({ driver }: { driver: Driver }) => {
        await login(driver);

        const perpsHomePage = new PerpsHomePage(driver);
        await perpsHomePage.navigateToPerpsHome();
        await perpsHomePage.waitForPositionsSection();
        await perpsHomePage.waitForPositionCard('ETH');
        await perpsHomePage.clickPositionCard('ETH');

        const marketDetailPage = new PerpsMarketDetailPage(driver);
        await marketDetailPage.checkPageIsLoaded();
        await marketDetailPage.checkPositionCtaButtonsVisible();

        await marketDetailPage.clickModify();
        await marketDetailPage.clickModifyMenuReversePosition();
        await marketDetailPage.waitForReversePositionModal();
        await marketDetailPage.waitForReversePositionSummaryRows();
        await marketDetailPage.confirmReversePosition();

        await marketDetailPage.waitForReversePositionModalClosed();

        const perpsServer = WebSocketRegistry.getServer(
          WEBSOCKET_SERVICES.perps,
        );
        pushPositionUpdate(perpsServer, {
          coin: 'ETH',
          szi: '-2.5',
          entryPx: '2850.00',
          leverage: 3,
          positionValue: '7125.0',
          accountValue: '12500.0',
          totalMarginUsed: '2375.0',
          withdrawable: '10125.0',
        });

        await marketDetailPage.checkPageIsLoaded();
        await marketDetailPage.checkPositionCtaButtonsVisible();
        await marketDetailPage.checkPositionSizeValue('2.5 ETH');
        await marketDetailPage.checkPositionLeverage('Short 3x');

        await marketDetailPage.clickBack();
        await perpsHomePage.navigateToPerpsHome();
        await perpsHomePage.waitForPositionsSection();
        await perpsHomePage.waitForPositionCardContains('ETH', '3x short');
        await perpsHomePage.waitForPositionCardSize('ETH', '2.5 ETH');
      },
    );
  });

  // eslint-disable-next-line mocha/no-skipped-tests -- Requires PERPS_ENABLED=true in test build; see web-socket-connection.spec.ts
  it.skip('reverses a BTC short position to long', async function () {
    await withFixtures(
      {
        ...getPerpsConfigEligible(this.test?.fullTitle()),
        perpsWebSocketSpecificMocks: WS_USER_WITH_BTC_SHORT_POSITION,
      },
      async ({ driver }: { driver: Driver }) => {
        await login(driver);

        const perpsHomePage = new PerpsHomePage(driver);
        await perpsHomePage.navigateToPerpsHome();
        await perpsHomePage.waitForPositionsSection();
        await perpsHomePage.waitForPositionCard('BTC');
        await perpsHomePage.clickPositionCard('BTC');

        const marketDetailPage = new PerpsMarketDetailPage(driver);
        await marketDetailPage.checkPageIsLoaded();
        await marketDetailPage.checkPositionCtaButtonsVisible();

        await marketDetailPage.clickModify();
        await marketDetailPage.clickModifyMenuReversePosition();
        await marketDetailPage.waitForReversePositionModal();
        await marketDetailPage.waitForReversePositionSummaryRows();
        await marketDetailPage.confirmReversePosition();

        await marketDetailPage.waitForReversePositionModalClosed();

        const perpsServer = WebSocketRegistry.getServer(
          WEBSOCKET_SERVICES.perps,
        );
        pushPositionUpdate(perpsServer, {
          coin: 'BTC',
          szi: '0.5',
          entryPx: '45000.00',
          leverage: 15,
          positionValue: '22500.0',
          accountValue: '10750.0',
          totalMarginUsed: '1500.0',
          withdrawable: '9500.0',
        });

        await marketDetailPage.checkPageIsLoaded();
        await marketDetailPage.checkPositionCtaButtonsVisible();
        await marketDetailPage.checkPositionSizeValue('0.5 BTC');
        await marketDetailPage.checkPositionLeverage('Long 15x');

        await marketDetailPage.clickBack();
        await perpsHomePage.navigateToPerpsHome();
        await perpsHomePage.waitForPositionsSection();
        await perpsHomePage.waitForPositionCardContains('BTC', '15x long');
        await perpsHomePage.waitForPositionCardSize('BTC', '0.5 BTC');
      },
    );
  });

  // ─── Margin management ─────────────────────────────────────────────────────
  it('adds margin to an existing ETH position and verifies liquidation price updates', async function () {
    await withFixtures(
      {
        ...getPerpsConfigEligible(this.test?.fullTitle()),
        perpsWebSocketSpecificMocks: WS_USER_WITH_ETH_LONG_POSITION,
        ignoredConsoleErrors: ['Value is null'],
      },
      async ({ driver }: { driver: Driver }) => {
        await login(driver);

        const perpsHomePage = new PerpsHomePage(driver);
        await perpsHomePage.navigateToPerpsHome();
        await perpsHomePage.waitForPositionsSection();
        await perpsHomePage.waitForPositionCard('ETH');
        await perpsHomePage.clickPositionCard('ETH');

        const marketDetailPage = new PerpsMarketDetailPage(driver);
        await marketDetailPage.checkPageIsLoaded();
        await marketDetailPage.checkPositionCtaButtonsVisible();
        await marketDetailPage.checkPositionLiquidationContains('2,400');

        await marketDetailPage.clickMarginMenu();
        await marketDetailPage.clickMarginMenuAdd();
        await marketDetailPage.waitForAddMarginModal();
        await marketDetailPage.waitForMarginModalAvailableBalance();

        await marketDetailPage.fillMarginModalAmount('add', '250');
        await marketDetailPage.saveMarginEdit();

        await marketDetailPage.waitForEditMarginModalClosed('add');

        const perpsServer = WebSocketRegistry.getServer(
          WEBSOCKET_SERVICES.perps,
        );
        pushPositionUpdate(perpsServer, {
          coin: 'ETH',
          szi: '2.5',
          entryPx: '2850.00',
          leverage: 3,
          positionValue: '7125.0',
          accountValue: '12875.0',
          totalMarginUsed: '2850.0',
          withdrawable: '10025.0',
          liquidationPx: '2320.00',
          unrealizedPnl: '375.0',
        });

        await marketDetailPage.checkPositionCtaButtonsVisible();
        await marketDetailPage.checkPositionLiquidationContains('2,320');
      },
    );
  });

  it('removes margin from an existing ETH position', async function () {
    await withFixtures(
      {
        ...getPerpsConfigEligible(this.test?.fullTitle()),
        perpsWebSocketSpecificMocks: WS_USER_WITH_ETH_LONG_POSITION,
        ignoredConsoleErrors: ['Value is null'],
      },
      async ({ driver }: { driver: Driver }) => {
        await login(driver);

        const perpsHomePage = new PerpsHomePage(driver);
        await perpsHomePage.navigateToPerpsHome();
        await perpsHomePage.waitForPositionsSection();
        await perpsHomePage.waitForPositionCard('ETH');
        await perpsHomePage.clickPositionCard('ETH');

        const marketDetailPage = new PerpsMarketDetailPage(driver);
        await marketDetailPage.checkPageIsLoaded();
        await marketDetailPage.checkPositionCtaButtonsVisible();
        await marketDetailPage.checkPositionLiquidationContains('2,400');

        await marketDetailPage.clickMarginMenu();
        await marketDetailPage.clickMarginMenuRemove();
        await marketDetailPage.waitForDecreaseMarginModal();
        await marketDetailPage.waitForMarginModalAvailableBalance();

        await marketDetailPage.fillMarginModalAmount('remove', '200');
        await marketDetailPage.saveMarginEdit();

        await marketDetailPage.waitForEditMarginModalClosed('remove');

        const perpsServer = WebSocketRegistry.getServer(
          WEBSOCKET_SERVICES.perps,
        );
        pushPositionUpdate(perpsServer, {
          coin: 'ETH',
          szi: '2.5',
          entryPx: '2850.00',
          leverage: 3,
          positionValue: '7125.0',
          accountValue: '12875.0',
          totalMarginUsed: '2400.0',
          withdrawable: '10475.0',
          liquidationPx: '2480.00',
          unrealizedPnl: '375.0',
        });

        await marketDetailPage.checkPositionCtaButtonsVisible();
        await marketDetailPage.checkPositionLiquidationContains('2,480');
      },
    );
  });

  // ─── Position card on home page ────────────────────────────────────────────

  it('position card is visible on Perps home when user has open ETH position', async function () {
    await withFixtures(
      {
        ...getPerpsConfigEligible(this.test?.fullTitle()),
        perpsWebSocketSpecificMocks: WS_USER_WITH_ETH_LONG_POSITION,
      },
      async ({ driver }: { driver: Driver }) => {
        await login(driver);

        const perpsHomePage = new PerpsHomePage(driver);
        await perpsHomePage.navigateToPerpsHome();
        await perpsHomePage.waitForPositionsSection();
        await perpsHomePage.waitForPositionCard('ETH');
        await perpsHomePage.waitForPositionCardSize('ETH', '2.5 ETH');
      },
    );
  });

  it('clicking a position card on home navigates to the ETH market detail', async function () {
    await withFixtures(
      {
        ...getPerpsConfigEligible(this.test?.fullTitle()),
        perpsWebSocketSpecificMocks: WS_USER_WITH_ETH_LONG_POSITION,
      },
      async ({ driver }: { driver: Driver }) => {
        await login(driver);

        const perpsHomePage = new PerpsHomePage(driver);
        await perpsHomePage.navigateToPerpsHome();
        await perpsHomePage.waitForPositionsSection();
        await perpsHomePage.waitForPositionCard('ETH');

        await perpsHomePage.clickPositionCard('ETH');

        const marketDetailPage = new PerpsMarketDetailPage(driver);
        await marketDetailPage.checkPageIsLoaded();
        await marketDetailPage.checkPositionCtaButtonsVisible();
        await marketDetailPage.checkPositionSizeValue('2.5 ETH');
      },
    );
  });
});
