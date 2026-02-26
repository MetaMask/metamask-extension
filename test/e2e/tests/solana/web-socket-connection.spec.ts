import { Suite } from 'mocha';
import { Driver } from '../../webdriver/driver';
import LocalWebSocketServer from '../../websocket-server';
import { withFixtures } from '../../helpers';
import { loginWithBalanceValidation } from '../../page-objects/flows/login.flow';
import FixtureBuilderV2 from '../../fixtures/fixture-builder-v2';

async function waitForWebsocketConnections(
  driver: Driver,
  expectedCount: number,
) {
  let connectionCount;
  await driver.wait(async () => {
    connectionCount =
      LocalWebSocketServer.getServerInstance().getWebsocketConnectionCount();
    return connectionCount === expectedCount;
  }, 10000);
}

describe('Solana Web Socket', function (this: Suite) {
  it('a websocket connection is open when MetaMask full view is open', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2().build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await loginWithBalanceValidation(driver);

        await waitForWebsocketConnections(driver, 1);
      },
    );
  });

  it('the websocket connection is maintained for a grace period when MetaMask window is closed', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2().build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await loginWithBalanceValidation(driver);
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
        fixtures: new FixtureBuilderV2().build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await loginWithBalanceValidation(driver);

        await waitForWebsocketConnections(driver, 1);

        await driver.openNewPage('about:blank');

        await driver.openNewPage(`${driver.extensionUrl}/home.html`);

        await waitForWebsocketConnections(driver, 1);

        await driver.switchToWindowWithTitle('MetaMask');
        await driver.closeWindow();

        await waitForWebsocketConnections(driver, 1);
        // Verify that websocket connection is NOT closed - second MM window still open (give it some time)

        await driver.switchToWindowWithTitle('MetaMask');
        await driver.closeWindow();

        await waitForWebsocketConnections(driver, 1);
        // The websocket close grace period is 5 minutes, we can't wait for this long to check if it's closed
      },
    );
  });
});
