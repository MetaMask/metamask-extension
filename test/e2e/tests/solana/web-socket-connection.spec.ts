import { strict as assert } from 'assert';
import { Suite } from 'mocha';
import {
  withSolanaAccountSnap,
  getWebsocketConnectionCount,
  cleanupWebsocketConnections,
} from './common-solana';

describe('Web Socket', function (this: Suite) {
  // Log initial state before each test
  beforeEach(async function () {
    getWebsocketConnectionCount();
  });

  // Cleanup websocket connections after each test to prevent cross-test contamination
  afterEach(async function () {
    await cleanupWebsocketConnections();
    getWebsocketConnectionCount();
  });

  it('a websocket connection is open when MetaMask full view is open', async function () {
    await withSolanaAccountSnap(
      {
        title: this.test?.fullTitle(),
      },
      async (driver) => {
        // Wait a moment for the websocket connection to be established
        await driver.delay(3000);

        assert.equal(
          getWebsocketConnectionCount(),
          1,
          'Expected a websocket connection to be established when MetaMask opens',
        );

        const connectionCount = getWebsocketConnectionCount();
        assert.equal(
          connectionCount,
          1,
          `Expected 1 websocket connection, but found ${connectionCount}`,
        );
      },
    );
  });

  it('websocket connection is closed when MetaMask window is closed', async function () {
    await withSolanaAccountSnap(
      {
        title: this.test?.fullTitle(),
      },
      async (driver) => {
        // Wait a moment for the websocket connection to be established
        await driver.delay(3000);

        // Open a blank page to prevent browser from closing
        await driver.openNewPage('about:blank');

        // Switch back to MetaMask window and close it
        await driver.switchToWindowWithTitle('MetaMask');
        await driver.closeWindow();

        // Wait a moment for the websocket to be stopped
        await driver.delay(3000);

        const activeWebSocketConnections = getWebsocketConnectionCount();
        assert.equal(
          activeWebSocketConnections,
          0,
          `Expected 0 websocket connections after closing MetaMask, but found ${activeWebSocketConnections}`,
        );
      },
    );
  });

  it('websocket connection is shared between multiple MetaMask windows', async function () {
    // Explicitly cleanup before this test to ensure clean state
    console.log('🧹 Explicit cleanup before multi-window test');
    await cleanupWebsocketConnections();

    await withSolanaAccountSnap(
      {
        title: this.test?.fullTitle(),
      },
      async (driver) => {
        // Wait a moment for the websocket connection to be established
        await driver.delay(3000);

        // Verify that a websocket connection has been established with first window
        let connectionCount = getWebsocketConnectionCount();
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
        await driver.delay(3000);
        connectionCount = getWebsocketConnectionCount();
        assert.equal(
          connectionCount,
          1,
          `Expected 1 websocket connection with two MM windows, but found ${connectionCount}`,
        );

        // Close the first MetaMask window
        await driver.switchToWindowWithTitle('MetaMask');
        await driver.closeWindow();

        // Verify that websocket connection is NOT closed - second MM window still open (give it some time)
        await driver.delay(3000);
        connectionCount = getWebsocketConnectionCount();
        assert.equal(
          connectionCount,
          1,
          `Expected 1 websocket connection after closing first MM window, but found ${connectionCount}`,
        );

        // Close the second MetaMask window
        await driver.switchToWindowWithTitle('MetaMask');
        await driver.closeWindow();

        // Wait a moment for the websocket to be stopped
        await driver.delay(3000);

        // Verify that websocket connection is now closed
        const activeWebSocketConnections = getWebsocketConnectionCount();
        assert.equal(
          activeWebSocketConnections,
          0,
          `Expected 0 websocket connections after closing all MM windows, but found ${activeWebSocketConnections}`,
        );
      },
    );
  });
});
