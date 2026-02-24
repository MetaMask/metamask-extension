import { strict as assert } from 'assert';
import { Suite } from 'mocha';
import { Driver } from '../../webdriver/driver';
import LocalWebSocketServer from '../../websocket-server';
import FixtureBuilder from '../../fixtures/fixture-builder';
import { withFixtures } from '../../helpers';
import { loginWithBalanceValidation } from '../../page-objects/flows/login.flow';

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

  console.log('connectionCount', connectionCount);
  assert.equal(
    connectionCount,
    expectedCount,
    `Expected ${expectedCount} websocket connections, but found ${connectionCount}`,
  );
}

describe('Solana Web Socket', function (this: Suite) {
  it('a websocket connection is open when MetaMask full view is open', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }) => {
        await loginWithBalanceValidation(driver);

        await waitForWebsocketConnections(driver, 1);
      },
    );
  });

  it('the websocket connection is maintained for a grace period when MetaMask window is closed', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }) => {
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
        fixtures: new FixtureBuilder().build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }) => {
        await loginWithBalanceValidation(driver);

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
