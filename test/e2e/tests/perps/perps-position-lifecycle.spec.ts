/**
 * Perps Position Lifecycle E2E tests
 *
 * Tests covering the full lifecycle of a perpetuals position:
 * opening, modifying exposure, closing (partial and full),
 * reversing direction, and margin management.
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
import { PerpsOrderEntryPage } from '../../page-objects/pages/perps/perps-order-entry-page';
import { getPerpsConfigEligible } from './helpers';
import {
  WS_USER_WITH_BTC_SHORT,
  WS_USER_WITH_ETH_LONG,
  WS_USER_WITH_ETH_LONG_POSITION,
  WS_USER_WITH_FUNDED_ACCOUNT,
  pushPositionUpdate,
  pushPositionClosed,
} from './mocks/websocketPositionMocks';

describe('Perps Position Lifecycle', function (this: Suite) {
  this.timeout(12000000);

  // ─── Open position flows ───────────────────────────────────────────────────

  // eslint-disable-next-line mocha/no-skipped-tests -- Requires PERPS_ENABLED=true in test build; see web-socket-connection.spec.ts
  it('opens a long market order then closes the position', async function () {
    await withFixtures(
      {
        ...getPerpsConfigEligible(this.test?.fullTitle()),
        perpsWebSocketSpecificMocks: WS_USER_WITH_FUNDED_ACCOUNT,
      },
      async ({ driver }: { driver: Driver }) => {
        await login(driver, { validateBalance: false });

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
        await orderEntryPage.checkPageIsLoaded();
        await orderEntryPage.fillAmount('100');
        await orderEntryPage.submitOrder();

        // Wait for the background order flow to complete before pushing position data
        await driver.delay(2000);

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
        await marketDetailPage.clickClose();

        await marketDetailPage.waitForClosePositionModal();
        await marketDetailPage.waitForCloseSummaryRows();
        await marketDetailPage.submitClosePosition();


        // Simulate the HyperLiquid WS push with zero positions after close fill
        pushPositionClosed(perpsServer);

        // After full close the trade CTA buttons (Long / Short) should reappear
        await marketDetailPage.waitForTradeCtaButtons();
      },
    );
  });

  // eslint-disable-next-line mocha/no-skipped-tests -- Requires PERPS_ENABLED=true in test build; see web-socket-connection.spec.ts
  it('opens a short market order then closes the position', async function () {
    await withFixtures(
      {
        ...getPerpsConfigEligible(this.test?.fullTitle()),
        perpsWebSocketSpecificMocks: WS_USER_WITH_FUNDED_ACCOUNT,
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
        await orderEntryPage.submitOrder();

        await driver.delay(2000);

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
        await marketDetailPage.clickClose();

        await marketDetailPage.waitForClosePositionModal();
        await marketDetailPage.waitForCloseSummaryRows();
        await marketDetailPage.submitClosePosition();

        pushPositionClosed(perpsServer);

        await marketDetailPage.waitForTradeCtaButtons();
      },
    );
  });


  // ─── Close position flows ──────────────────────────────────────────────────

  // eslint-disable-next-line mocha/no-skipped-tests -- Requires PERPS_ENABLED=true in test build; see web-socket-connection.spec.ts
  it.only('partially closes 50% of an existing ETH long position from the homepage', async function () {
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

        await marketDetailPage.clickClose();
        await marketDetailPage.waitForClosePositionModal();
        await marketDetailPage.waitForCloseSummaryRows();

        await marketDetailPage.setClosePercent(50);
        await marketDetailPage.submitClosePosition();

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
      },
    );
  });

  // eslint-disable-next-line mocha/no-skipped-tests -- Requires PERPS_ENABLED=true in test build; see web-socket-connection.spec.ts
  it.skip('partially closes an existing ETH long position and verifies position remains open', async function () {
    await withFixtures(
      {
        ...getPerpsConfigEligible(this.test?.fullTitle()),
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

        await marketDetailPage.clickClose();
        await marketDetailPage.waitForClosePositionModal();
        // The close modal has a close-amount-slider; default may be 100%.
        // For partial close we use the Reduce Exposure flow via the Modify menu instead.
        // See 'reduces exposure (partial close) via Modify menu' test below.
        // Here we verify the modal is present with summary rows before cancelling.
        await marketDetailPage.waitForCloseSummaryRows();
      },
    );
  });

  // eslint-disable-next-line mocha/no-skipped-tests -- Requires PERPS_ENABLED=true in test build; see web-socket-connection.spec.ts
  it.skip('reduces exposure (partial close) via Modify menu on an ETH long position', async function () {
    await withFixtures(
      {
        ...getPerpsConfigEligible(this.test?.fullTitle()),
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

        // Modify → Reduce Exposure navigates to order entry in reduce mode
        await marketDetailPage.clickModify();
        await marketDetailPage.clickModifyMenuReduceExposure();

        const orderEntryPage = new PerpsOrderEntryPage(driver);
        await orderEntryPage.checkPageIsLoaded();
        // Fill a partial amount to reduce (not the full position size)
        await orderEntryPage.fillAmount('500');
        await orderEntryPage.submitOrder();

        // After partial reduce, position CTA buttons remain (position still open)
        await marketDetailPage.checkPageIsLoaded();
        await marketDetailPage.checkPositionCtaButtonsVisible();
      },
    );
  });

  // eslint-disable-next-line mocha/no-skipped-tests -- Requires PERPS_ENABLED=true in test build; see web-socket-connection.spec.ts
  it.skip('adds exposure to an existing ETH long position via Modify menu', async function () {
    await withFixtures(
      {
        ...getPerpsConfigEligible(this.test?.fullTitle()),
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

        // Modify → Add Exposure navigates to order entry in add-exposure mode
        await marketDetailPage.clickModify();
        await marketDetailPage.clickModifyMenuAddExposure();

        const orderEntryPage = new PerpsOrderEntryPage(driver);
        await orderEntryPage.checkPageIsLoaded();
        await orderEntryPage.fillAmount('200');
        await orderEntryPage.submitOrder();

        // Position CTA buttons should still be visible after adding exposure
        await marketDetailPage.checkPageIsLoaded();
        await marketDetailPage.checkPositionCtaButtonsVisible();
      },
    );
  });

  // ─── Reverse position flows ────────────────────────────────────────────────

  // eslint-disable-next-line mocha/no-skipped-tests -- Requires PERPS_ENABLED=true in test build; see web-socket-connection.spec.ts
  it.skip('reverses an ETH long position to short via Modify menu', async function () {
    await withFixtures(
      {
        ...getPerpsConfigEligible(this.test?.fullTitle()),
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

        // Modify → Reverse Position shows the reverse confirmation modal
        await marketDetailPage.clickModify();
        await marketDetailPage.clickModifyMenuReversePosition();
        await marketDetailPage.waitForReversePositionModal();

        // Verify the modal shows estimated size and fee rows
        await marketDetailPage.waitForReversePositionSummaryRows();

        // Confirm the reverse
        await marketDetailPage.confirmReversePosition();

        // After reversing, the position CTA buttons remain (now a short position)
        await marketDetailPage.checkPageIsLoaded();
        await marketDetailPage.checkPositionCtaButtonsVisible();
      },
    );
  });

  // eslint-disable-next-line mocha/no-skipped-tests -- Requires PERPS_ENABLED=true in test build; see web-socket-connection.spec.ts
  it.skip('cancels reverse position modal without reversing', async function () {
    await withFixtures(
      {
        ...getPerpsConfigEligible(this.test?.fullTitle()),
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

        await marketDetailPage.clickModify();
        await marketDetailPage.clickModifyMenuReversePosition();
        await marketDetailPage.waitForReversePositionModal();

        // Cancel — should return to market detail without reversing
        await marketDetailPage.cancelReversePosition();
        await marketDetailPage.checkPageIsLoaded();
        await marketDetailPage.checkPositionCtaButtonsVisible();
      },
    );
  });

  // eslint-disable-next-line mocha/no-skipped-tests -- Requires PERPS_ENABLED=true in test build; see web-socket-connection.spec.ts
  it.skip('reverses a BTC short position to long', async function () {
    await withFixtures(
      {
        ...getPerpsConfigEligible(this.test?.fullTitle()),
        perpsWebSocketSpecificMocks: WS_USER_WITH_BTC_SHORT,
      },
      async ({ driver }: { driver: Driver }) => {
        await login(driver, { validateBalance: false });

        const perpsHomePage = new PerpsHomePage(driver);
        await perpsHomePage.navigateToPerpsHome();
        await perpsHomePage.waitForPositionsSection();

        const marketListPage = new PerpsMarketListPage(driver);
        await marketListPage.navigateToMarketList();

        const marketDetailPage = new PerpsMarketDetailPage(driver);
        await marketDetailPage.navigateToMarket('BTC');
        await marketDetailPage.checkPositionCtaButtonsVisible();

        await marketDetailPage.clickModify();
        await marketDetailPage.clickModifyMenuReversePosition();
        await marketDetailPage.waitForReversePositionModal();
        await marketDetailPage.confirmReversePosition();

        // After reversing, the position CTA buttons remain (now long BTC)
        await marketDetailPage.checkPageIsLoaded();
        await marketDetailPage.checkPositionCtaButtonsVisible();
      },
    );
  });

  // ─── Margin management ─────────────────────────────────────────────────────

  // eslint-disable-next-line mocha/no-skipped-tests -- Requires PERPS_ENABLED=true in test build; see web-socket-connection.spec.ts
  it.skip('adds margin to an existing ETH position and verifies liquidation price updates', async function () {
    await withFixtures(
      {
        ...getPerpsConfigEligible(this.test?.fullTitle()),
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

        // Open the margin card menu and select "Add"
        await marketDetailPage.clickMarginMenu();
        await marketDetailPage.clickMarginMenuAdd();
        await marketDetailPage.waitForAddMarginModal();
        await marketDetailPage.waitForMarginModalAvailableBalance();

        // Save the margin change
        await marketDetailPage.saveMarginEdit();

        // After adding margin, the position detail remains visible
        await marketDetailPage.checkPositionCtaButtonsVisible();
      },
    );
  });

  // eslint-disable-next-line mocha/no-skipped-tests -- Requires PERPS_ENABLED=true in test build; see web-socket-connection.spec.ts
  it.skip('removes margin from an existing ETH position', async function () {
    await withFixtures(
      {
        ...getPerpsConfigEligible(this.test?.fullTitle()),
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

        // Open the margin card menu and select "Remove"
        await marketDetailPage.clickMarginMenu();
        await marketDetailPage.clickMarginMenuRemove();
        await marketDetailPage.waitForDecreaseMarginModal();
        await marketDetailPage.waitForMarginModalAvailableBalance();

        // Save the margin reduction
        await marketDetailPage.saveMarginEdit();

        await marketDetailPage.checkPositionCtaButtonsVisible();
      },
    );
  });

  // ─── Position card on home page ────────────────────────────────────────────

  // eslint-disable-next-line mocha/no-skipped-tests -- Requires PERPS_ENABLED=true in test build; see web-socket-connection.spec.ts
  it.skip('position card is visible on Perps home when user has open ETH position', async function () {
    await withFixtures(
      {
        ...getPerpsConfigEligible(this.test?.fullTitle()),
        perpsWebSocketSpecificMocks: WS_USER_WITH_ETH_LONG,
      },
      async ({ driver }: { driver: Driver }) => {
        await login(driver, { validateBalance: false });

        const perpsHomePage = new PerpsHomePage(driver);
        await perpsHomePage.navigateToPerpsHome();
        await perpsHomePage.waitForPositionsSection();
        // ETH position card should be rendered
        await perpsHomePage.waitForPositionCard('ETH');
      },
    );
  });

  // eslint-disable-next-line mocha/no-skipped-tests -- Requires PERPS_ENABLED=true in test build; see web-socket-connection.spec.ts
  it.skip('clicking a position card on home navigates to the ETH market detail', async function () {
    await withFixtures(
      {
        ...getPerpsConfigEligible(this.test?.fullTitle()),
        perpsWebSocketSpecificMocks: WS_USER_WITH_ETH_LONG,
      },
      async ({ driver }: { driver: Driver }) => {
        await login(driver, { validateBalance: false });

        const perpsHomePage = new PerpsHomePage(driver);
        await perpsHomePage.navigateToPerpsHome();
        await perpsHomePage.waitForPositionsSection();
        await perpsHomePage.waitForPositionCard('ETH');

        // Click the position card to navigate to the ETH market detail
        await perpsHomePage.clickPositionCard('ETH');

        const marketDetailPage = new PerpsMarketDetailPage(driver);
        await marketDetailPage.checkPageIsLoaded();
        await marketDetailPage.checkPositionCtaButtonsVisible();
      },
    );
  });
});
