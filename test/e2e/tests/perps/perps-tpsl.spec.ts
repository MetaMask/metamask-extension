/**
 * Perps Take Profit / Stop Loss E2E tests
 *
 * Two end-to-end flows that end with a mocked Hyperliquid-style stream update:
 * after configuring only TP or only SL on an ETH long, `pushPositionClosed` simulates
 * the clearinghouse state the server would send once that trigger has filled (UI cannot
 * run the real price-crossing matcher in E2E).
 * A short delay before `pushPositionClosed` is required: `PerpsStreamManager` ignores
 * incoming position WS pushes for 3000 ms after optimistic TP/SL (`WEBSOCKET_BLOCK_MS`).
 *
 * PREREQUISITE: PERPS_ENABLED=true in the extension build (.metamaskrc).
 */
import { Suite } from 'mocha';
import { withFixtures } from '../../helpers';
import WebSocketRegistry from '../../websocket/registry';
import { WEBSOCKET_SERVICES } from '../../websocket/constants';
import { Driver } from '../../webdriver/driver';
import { login } from '../../page-objects/flows/login.flow';
import { PerpsHomePage } from '../../page-objects/pages/perps/perps-home-page';
import { PerpsMarketDetailPage } from '../../page-objects/pages/perps/perps-market-detail-page';
import { getPerpsConfigEligible } from './helpers';
import {
  WS_USER_WITH_ETH_LONG_POSITION,
  pushPositionClosed,
} from './mocks/websocketPositionMocks';

describe('Perps Take Profit / Stop Loss', function (this: Suite) {
  this.timeout(120000);

  it('simulates take-profit fill: TP set on ETH long then stream clears the position', async function () {
    await withFixtures(
      {
        ...getPerpsConfigEligible(this.test?.fullTitle()),
        perpsWebSocketSpecificMocks: WS_USER_WITH_ETH_LONG_POSITION,
      },
      async ({ driver }: { driver: Driver }) => {
        await login(driver, { validateBalance: false });

        const perpsHomePage = new PerpsHomePage(driver);
        await perpsHomePage.navigateToPerpsHome();
        await perpsHomePage.waitForPositionsSection();
        await perpsHomePage.waitForPositionCard('ETH');
        await perpsHomePage.clickPositionCard('ETH');

        const marketDetailPage = new PerpsMarketDetailPage(driver);
        await marketDetailPage.checkPageIsLoaded();
        await marketDetailPage.checkPositionCtaButtonsVisible();
        await marketDetailPage.waitForAutoCloseRow();

        await marketDetailPage.clickAutoCloseRow();
        await marketDetailPage.waitForUpdateTpslModal();
        await marketDetailPage.fillTpPriceInTpslModal('3500.00');
        await marketDetailPage.submitTpslUpdate();
        await marketDetailPage.waitForUpdateTpslModalClosed();

        await marketDetailPage.checkAutoCloseRowContains('3,500');

        // PerpsStreamManager drops incoming `positions` WS updates for WEBSOCKET_BLOCK_MS (3000)
        // after optimistic TP/SL; wait so `pushPositionClosed` is not ignored.
        await driver.delay(3200);

        const perpsServer = WebSocketRegistry.getServer(
          WEBSOCKET_SERVICES.perps,
        );
        pushPositionClosed(perpsServer);

        await marketDetailPage.waitForTradeCtaButtons();
      },
    );
  });

  it('simulates stop-loss fill: SL set on ETH long then stream clears the position', async function () {
    await withFixtures(
      {
        ...getPerpsConfigEligible(this.test?.fullTitle()),
        perpsWebSocketSpecificMocks: WS_USER_WITH_ETH_LONG_POSITION,
      },
      async ({ driver }: { driver: Driver }) => {
        await login(driver, { validateBalance: false });

        const perpsHomePage = new PerpsHomePage(driver);
        await perpsHomePage.navigateToPerpsHome();
        await perpsHomePage.waitForPositionsSection();
        await perpsHomePage.waitForPositionCard('ETH');
        await perpsHomePage.clickPositionCard('ETH');

        const marketDetailPage = new PerpsMarketDetailPage(driver);
        await marketDetailPage.checkPageIsLoaded();
        await marketDetailPage.checkPositionCtaButtonsVisible();
        await marketDetailPage.waitForAutoCloseRow();

        await marketDetailPage.clickAutoCloseRow();
        await marketDetailPage.waitForUpdateTpslModal();
        await marketDetailPage.fillSlPriceInTpslModal('2400.00');
        await marketDetailPage.submitTpslUpdate();
        await marketDetailPage.waitForUpdateTpslModalClosed();

        await marketDetailPage.checkAutoCloseRowContains('2,400');

        // Same WEBSOCKET_BLOCK_MS window as optimistic TP/SL (see TP scenario above).
        await driver.delay(3200);

        const perpsServer = WebSocketRegistry.getServer(
          WEBSOCKET_SERVICES.perps,
        );
        pushPositionClosed(perpsServer);

        await marketDetailPage.waitForTradeCtaButtons();
      },
    );
  });
});
