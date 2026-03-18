import { Suite } from 'mocha';
import { Driver } from '../../webdriver/driver';
import { WEBSOCKET_SERVICES } from '../../websocket/constants';
import WebSocketRegistry from '../../websocket/registry';
import { withFixtures } from '../../helpers';
import { loginWithBalanceValidation } from '../../page-objects/flows/login.flow';
import { PerpsHomePage } from '../../page-objects/pages/perps/perps-home-page';
import { getConfig } from './helpers';

async function waitForPerpsWebsocketConnections(
  driver: Driver,
  expectedCount: number,
) {
  await driver.waitUntil(
    async () => {
      const connectionCount = WebSocketRegistry.getServer(
        WEBSOCKET_SERVICES.perps,
      ).getWebsocketConnectionCount();
      return connectionCount === expectedCount;
    },
    { timeout: 10000, interval: 500 },
  );
}

/**
 * Perps Web Socket E2E tests — SKIPPED until real PerpsController is integrated.
 *
 * Reasons:
 * - The extension currently uses MockPerpsController (see test/e2e/tests/perps/helpers.ts
 * and ui/providers/perps/getPerpsController.mock.ts). The mock only logs subscription
 * calls and does not open real WebSocket connections.
 * - These tests expect the Perps view to open a connection to wss://api.hyperliquid.xyz/ws,
 * which mock-e2e.js forwards to ws://localhost:8090. The mock server never receives
 * a connection because no code path opens that WebSocket while MockPerpsController is in use.
 * - To enable: integrate the real PerpsController that connects to Hyperliquid's WebSocket API,
 * then remove the skip below. The perps mock server and forward are already set up.
 */
// eslint-disable-next-line mocha/no-skipped-tests -- Skipped until real PerpsController opens WebSocket; see comment above.
describe.skip('Perps Web Socket', function (this: Suite) {
  this.timeout(120000);

  it('a websocket connection is open when Perps view is open', async function () {
    await withFixtures(
      {
        ...getConfig(this.test?.fullTitle()),
      },
      async ({ driver }: { driver: Driver }) => {
        await loginWithBalanceValidation(driver);

        const perpsHomePage = new PerpsHomePage(driver);
        await perpsHomePage.navigateToPerpsHome();
        await perpsHomePage.waitForBalanceSection();

        await waitForPerpsWebsocketConnections(driver, 1);
      },
    );
  });

  it('the websocket connection is maintained for a grace period when MetaMask window is closed', async function () {
    await withFixtures(
      {
        ...getConfig(this.test?.fullTitle()),
      },
      async ({ driver }: { driver: Driver }) => {
        await loginWithBalanceValidation(driver);

        const perpsHomePage = new PerpsHomePage(driver);
        await perpsHomePage.navigateToPerpsHome();
        await perpsHomePage.waitForBalanceSection();

        await waitForPerpsWebsocketConnections(driver, 1);

        await driver.openNewPage('about:blank');

        await driver.switchToWindowWithTitle('MetaMask');
        await driver.closeWindow();

        await waitForPerpsWebsocketConnections(driver, 1);
      },
    );
  });

  it('websocket connection is shared between multiple MetaMask windows', async function () {
    await withFixtures(
      {
        ...getConfig(this.test?.fullTitle()),
      },
      async ({ driver }: { driver: Driver }) => {
        await loginWithBalanceValidation(driver);

        const perpsHomePage = new PerpsHomePage(driver);
        await perpsHomePage.navigateToPerpsHome();
        await perpsHomePage.waitForBalanceSection();

        await waitForPerpsWebsocketConnections(driver, 1);

        await driver.openNewPage('about:blank');

        await driver.openNewPage(`${driver.extensionUrl}/home.html`);

        await waitForPerpsWebsocketConnections(driver, 1);

        await driver.switchToWindowWithTitle('MetaMask');
        await driver.closeWindow();

        await waitForPerpsWebsocketConnections(driver, 1);

        await driver.switchToWindowWithTitle('MetaMask');
        await driver.closeWindow();

        await waitForPerpsWebsocketConnections(driver, 1);
      },
    );
  });
});
