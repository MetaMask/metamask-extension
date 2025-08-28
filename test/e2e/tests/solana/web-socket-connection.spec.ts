import { strict as assert } from 'assert';
import { Suite } from 'mocha';
import { Driver } from '../../webdriver/driver';
import { withFixtures } from '../../helpers';
import { ACCOUNT_TYPE } from '../../constants';
import { loginWithBalanceValidation } from '../../page-objects/flows/login.flow';
import HeaderNavbar from '../../page-objects/pages/header-navbar';
import AccountListPage from '../../page-objects/pages/account-list-page';
import FixtureBuilder from '../../fixture-builder';
import LocalWebSocketServer from '../../websocket-server';

describe('Solana Web Socket', function (this: Suite) {
  it('a websocket connection is open when MetaMask full view is open', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        title: this.test?.fullTitle(),
        withSolanaWebSocket: true,
        manifestFlags: {
          remoteFeatureFlags: {
            addSolanaAccount: true,
          },
        },
      },
      async ({ driver }: { driver: Driver }) => {
        await loginWithBalanceValidation(driver);

        const headerComponent = new HeaderNavbar(driver);
        const accountListPage = new AccountListPage(driver);

        await headerComponent.openAccountMenu();
        await accountListPage.addAccount({
          accountType: ACCOUNT_TYPE.Solana,
          accountName: `Solana ${1}`,
        });

        assert.equal(
          LocalWebSocketServer.getServerInstance().getWebsocketConnectionCount(),
          1,
          'Expected a websocket connection to be established when MetaMask opens',
        );

        const connectionCount =
          LocalWebSocketServer.getServerInstance().getWebsocketConnectionCount();
        assert.equal(
          connectionCount,
          1,
          `Expected 1 websocket connection, but found ${connectionCount}`,
        );
      },
    );
  });

  it('the websocket connection is closed when MetaMask window is closed', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        title: this.test?.fullTitle(),
        withSolanaWebSocket: true,
        manifestFlags: {
          remoteFeatureFlags: {
            addSolanaAccount: true,
          },
        },
      },
      async ({ driver }: { driver: Driver }) => {
        await loginWithBalanceValidation(driver);

        const headerComponent = new HeaderNavbar(driver);
        const accountListPage = new AccountListPage(driver);

        await headerComponent.openAccountMenu();
        await accountListPage.addAccount({
          accountType: ACCOUNT_TYPE.Solana,
          accountName: `Solana ${1}`,
        });

        // Open a blank page to prevent browser from closing
        await driver.openNewPage('about:blank');

        // Switch back to MetaMask window and close it
        await driver.switchToWindowWithTitle('MetaMask');
        await driver.closeWindow();

        // Wait a moment for the websocket to be stopped
        await driver.delay(5000);

        const activeWebSocketConnections =
          LocalWebSocketServer.getServerInstance().getWebsocketConnectionCount();
        assert.equal(
          activeWebSocketConnections,
          0,
          `Expected 0 websocket connections after closing MetaMask, but found ${activeWebSocketConnections}`,
        );
      },
    );
  });

  it('websocket connection is shared between multiple MetaMask windows', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        title: this.test?.fullTitle(),
        withSolanaWebSocket: true,
        manifestFlags: {
          remoteFeatureFlags: {
            addSolanaAccount: true,
          },
        },
      },
      async ({ driver }: { driver: Driver }) => {
        await loginWithBalanceValidation(driver);

        const headerComponent = new HeaderNavbar(driver);
        const accountListPage = new AccountListPage(driver);

        await headerComponent.openAccountMenu();
        await accountListPage.addAccount({
          accountType: ACCOUNT_TYPE.Solana,
          accountName: `Solana ${1}`,
        });

        // Verify that a websocket connection has been established with first window
        let connectionCount =
          LocalWebSocketServer.getServerInstance().getWebsocketConnectionCount();
        assert.equal(
          connectionCount,
          1,
          `Expected 1 websocket connection with first MM window, but found ${connectionCount}`,
        );

        // Open a blank page to prevent browser from closing
        await driver.openNewPage('about:blank');

        // Open a new MetaMask window
        await driver.openNewPage(`${driver.extensionUrl}/home.html`);

        // Verify that no new websocket connection is opened (give it some time)
        await driver.delay(5000);
        connectionCount =
          LocalWebSocketServer.getServerInstance().getWebsocketConnectionCount();
        assert.equal(
          connectionCount,
          1,
          `Expected 1 websocket connection with two MM windows, but found ${connectionCount}`,
        );

        // Close the first MetaMask window
        await driver.switchToWindowWithTitle('MetaMask');
        await driver.closeWindow();

        // Verify that websocket connection is NOT closed - second MM window still open (give it some time)
        await driver.delay(5000);
        connectionCount =
          LocalWebSocketServer.getServerInstance().getWebsocketConnectionCount();
        assert.equal(
          connectionCount,
          1,
          `Expected 1 websocket connection after closing first MM window, but found ${connectionCount}`,
        );

        // Close the second MetaMask window
        await driver.switchToWindowWithTitle('MetaMask');
        await driver.closeWindow();

        // Wait a moment for the websocket to be stopped
        await driver.delay(5000);

        // Verify that websocket connection is now closed
        const activeWebSocketConnections =
          LocalWebSocketServer.getServerInstance().getWebsocketConnectionCount();
        assert.equal(
          activeWebSocketConnections,
          0,
          `Expected 0 websocket connections after closing all MM windows, but found ${activeWebSocketConnections}`,
        );
      },
    );
  });
});
