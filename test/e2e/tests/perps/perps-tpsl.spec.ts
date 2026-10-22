/**
 * Perps Take Profit / Stop Loss E2E tests
 *
 * Two end-to-end flows that end with a mocked Hyperliquid-style stream update:
 * after configuring only TP or only SL on an ETH long, `pushPositionClosed` simulates
 * the clearinghouse state the server would send once that trigger has filled (UI cannot
 * run the real price-crossing matcher in E2E). Each test then pushes a `userFills`
 * snapshot and opens Perps Activity to assert the close-long trade row.
 * When `pushPositionClosed` is called, it records the closed account immediately and
 * delays its websocket pushes for 3200 ms. This is because `PerpsStreamManager` ignores
 * incoming position WS pushes for 3000 ms after optimistic TP/SL (`WEBSOCKET_BLOCK_MS`),
 * while an account refresh during that window must already see the closed position.
 *
 * PREREQUISITE: PERPS_ENABLED=true in the extension build (.metamaskrc).
 */
import { Suite } from 'mocha';
import { withFixtures } from '../../helpers';
import WebSocketRegistry from '../../websocket/registry';
import { WEBSOCKET_SERVICES } from '../../websocket/constants';
import { Driver } from '../../webdriver/driver';
import { login } from '../../page-objects/flows/login.flow';
import { PerpsTab } from '../../page-objects/pages/home/perps-tab';
import { PerpsMarketDetailPage } from '../../page-objects/pages/perps/perps-market-detail-page';
import { assertPerpsActivityShowsCloseFill } from '../../page-objects/flows/perps-activity-close-fill.flow';
import { getPerpsConfigEligibleWithEthLongPosition } from './perps-fixture-config';
import {
  WS_USER_WITH_ETH_LONG_POSITION,
  pushPositionClosed,
  pushUserFillsClosePositionSnapshot,
} from './mocks/websocketPositionMocks';

describe('Perps Take Profit / Stop Loss', function (this: Suite) {
  this.timeout(120000);

  it('simulates take-profit fill: TP set on ETH long then stream clears the position', async function () {
    await withFixtures(
      {
        ...getPerpsConfigEligibleWithEthLongPosition(this.test?.fullTitle()),
        perpsWebSocketSpecificMocks: WS_USER_WITH_ETH_LONG_POSITION,
      },
      async ({ driver }: { driver: Driver }) => {
        await login(driver);

        const perpsTab = new PerpsTab(driver);
        await perpsTab.navigateToPerpsHome();
        await perpsTab.waitForPositionsSection();
        await perpsTab.waitForPositionCard('ETH');
        await perpsTab.clickPositionCard('ETH');

        const marketDetailPage = new PerpsMarketDetailPage(driver);
        await marketDetailPage.checkPageIsLoaded();
        await marketDetailPage.checkPositionCtaButtonsVisible();

        await marketDetailPage.setTakeProfit('3500.00');

        await marketDetailPage.checkAutoCloseRowContains('3,500');

        const perpsServer = WebSocketRegistry.getServer(
          WEBSOCKET_SERVICES.perps,
        );
        pushPositionClosed(perpsServer, { deliverAfterMs: 3200 });
        await driver.delay(3200);

        await marketDetailPage.waitForTradeCtaButtons();

        await assertPerpsActivityShowsCloseFill({
          driver,
          pushUserFills: () =>
            pushUserFillsClosePositionSnapshot(perpsServer, {
              coin: 'ETH',
              px: '3500.0',
              sz: '2.5',
              side: 'A',
              dir: 'Close Long',
              startPosition: '2.5',
              oid: 9_101_001,
              tid: 9_101_002,
            }),
          expectedTitleContains: 'Closed long',
        });
      },
    );
  });

  it('simulates stop-loss fill: SL set on ETH long then stream clears the position', async function () {
    await withFixtures(
      {
        ...getPerpsConfigEligibleWithEthLongPosition(this.test?.fullTitle()),
        perpsWebSocketSpecificMocks: WS_USER_WITH_ETH_LONG_POSITION,
      },
      async ({ driver }: { driver: Driver }) => {
        await login(driver);

        const perpsTab = new PerpsTab(driver);
        await perpsTab.navigateToPerpsHome();
        await perpsTab.waitForPositionsSection();
        await perpsTab.waitForPositionCard('ETH');
        await perpsTab.clickPositionCard('ETH');

        const marketDetailPage = new PerpsMarketDetailPage(driver);
        await marketDetailPage.checkPageIsLoaded();
        await marketDetailPage.checkPositionCtaButtonsVisible();

        await marketDetailPage.setStopLoss('2500.00');

        await marketDetailPage.checkAutoCloseRowContains('2,500');

        const perpsServer = WebSocketRegistry.getServer(
          WEBSOCKET_SERVICES.perps,
        );
        pushPositionClosed(perpsServer, { deliverAfterMs: 3200 });
        await driver.delay(3200);

        await marketDetailPage.waitForTradeCtaButtons();

        await assertPerpsActivityShowsCloseFill({
          driver,
          pushUserFills: () =>
            pushUserFillsClosePositionSnapshot(perpsServer, {
              coin: 'ETH',
              px: '2500.0',
              sz: '2.5',
              side: 'A',
              dir: 'Close Long',
              startPosition: '2.5',
              oid: 9_102_001,
              tid: 9_102_002,
            }),
          expectedTitleContains: 'Closed long',
        });
      },
    );
  });
});
