import { Suite } from 'mocha';
import { Driver } from '../../webdriver/driver';
import WebSocketRegistry from '../../websocket/registry';
import { withFixtures } from '../../helpers';
import { loginWithoutBalanceValidation } from '../../page-objects/flows/login.flow';
import { PerpsHomePage } from '../../page-objects/pages/perps/perps-home-page';
import { getConfig } from './helpers';
import { WEBSOCKET_SERVICES } from '../../websocket/constants';

async function waitForWebsocketConnections(
  driver: Driver,
  expectedCount: number,
) {
  let connectionCount;
  await driver.wait(async () => {
    connectionCount = WebSocketRegistry.getServer(
      WEBSOCKET_SERVICES.perps,
    ).getWebsocketConnectionCount();
    return connectionCount === expectedCount;
  }, 10000);
}

describe('Perps Web Socket', function (this: Suite) {
  this.timeout(120000);

  it('a websocket connection is open when Perps view is open', async function () {
    await withFixtures(
      {
        ...getConfig(this.test?.fullTitle()),
      },
      async ({ driver }: { driver: Driver }) => {
        await loginWithoutBalanceValidation(driver);

        const perpsHomePage = new PerpsHomePage(driver);
        await perpsHomePage.navigateToPerpsHome();
        await perpsHomePage.waitForBalanceSection();

        await waitForWebsocketConnections(driver, 1);
      },
    );
  });

  it('the websocket connection is maintained for a grace period when MetaMask window is closed', async function () {
    await withFixtures(
      {
        ...getConfig(this.test?.fullTitle()),
      },
      async ({ driver }: { driver: Driver }) => {
        await loginWithoutBalanceValidation(driver);

        const perpsHomePage = new PerpsHomePage(driver);
        await perpsHomePage.navigateToPerpsHome();
        await perpsHomePage.waitForBalanceSection();

        await waitForWebsocketConnections(driver, 1);

        await driver.openNewPage('about:blank');

        await driver.switchToWindowWithTitle('MetaMask');
        await driver.closeWindow();

        await waitForWebsocketConnections(driver, 1);
      },
    );
  });

  it('websocket connection is shared between multiple MetaMask windows', async function () {
    await withFixtures(
      {
        ...getConfig(this.test?.fullTitle()),
      },
      async ({ driver }: { driver: Driver }) => {
        await loginWithoutBalanceValidation(driver);

        const perpsHomePage = new PerpsHomePage(driver);
        await perpsHomePage.navigateToPerpsHome();
        await perpsHomePage.waitForBalanceSection();

        await waitForWebsocketConnections(driver, 1);

        await driver.openNewPage('about:blank');

        await driver.openNewPage(`${driver.extensionUrl}/home.html`);

        await waitForWebsocketConnections(driver, 1);

        await driver.switchToWindowWithTitle('MetaMask');
        await driver.closeWindow();

        await waitForWebsocketConnections(driver, 1);

        await driver.switchToWindowWithTitle('MetaMask');
        await driver.closeWindow();

        await waitForWebsocketConnections(driver, 1);
      },
    );
  });
});
