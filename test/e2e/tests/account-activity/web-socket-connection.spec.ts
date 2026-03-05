import { Suite } from 'mocha';
import { Driver } from '../../webdriver/driver';
import WebSocketRegistry from '../../websocket/registry';
import { withFixtures } from '../../helpers';
import { loginWithBalanceValidation } from '../../page-objects/flows/login.flow';
import FixtureBuilderV2 from '../../fixtures/fixture-builder-v2';
import { WEBSOCKET_SERVICES } from '../../websocket/constants';

async function waitForAccountActivityWebsocketConnections(
  driver: Driver,
  expectedCount: number,
) {
  let connectionCount;
  await driver.wait(async () => {
    connectionCount = WebSocketRegistry.getServer(
      WEBSOCKET_SERVICES.accountActivity,
    ).getWebsocketConnectionCount();
    return connectionCount === expectedCount;
  }, 20000);
}

describe('Account Activity Web Socket', function (this: Suite) {
  it('a websocket connection is open when MetaMask full view is open', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2().build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await loginWithBalanceValidation(driver);

        await waitForAccountActivityWebsocketConnections(driver, 1);
      },
    );
  });

  it('the websocket connection is closed when MetaMask window is closed', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2().build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await loginWithBalanceValidation(driver);
        await waitForAccountActivityWebsocketConnections(driver, 1);

        await driver.openNewPage('about:blank');

        await driver.switchToWindowWithTitle('MetaMask');
        await driver.closeWindow();

        await waitForAccountActivityWebsocketConnections(driver, 0);
      },
    );
  });

  it('websocket connection is shared between multiple MetaMask windows', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2().build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await loginWithBalanceValidation(driver);

        await waitForAccountActivityWebsocketConnections(driver, 1);

        await driver.openNewPage('about:blank');

        await driver.openNewPage(`${driver.extensionUrl}/home.html`);

        await waitForAccountActivityWebsocketConnections(driver, 1);

        await driver.switchToWindowWithTitle('MetaMask');
        await driver.closeWindow();

        await waitForAccountActivityWebsocketConnections(driver, 1);

        await driver.switchToWindowWithTitle('MetaMask');
        await driver.closeWindow();

        await waitForAccountActivityWebsocketConnections(driver, 0);
      },
    );
  });
});
