const { strict: assert } = require('assert');
const FixtureBuilder = require('../../fixture-builder');
const {
  withFixtures,
  openDapp,
  unlockWallet,
  DAPP_URL,
  regularDelayMs,
  WINDOW_TITLES,
  switchToNotificationWindow,
  defaultGanacheOptions,
} = require('../../helpers');

describe('Request Queueing', function () {
  it('should keep subscription on dapp network when switching different mm network', async function () {
    const port = 8546;
    const chainId = 1338;
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder()
          .withNetworkControllerDoubleGanache()
          .withPreferencesControllerUseRequestQueueEnabled()
          .build(),
        ganacheOptions: {
          ...defaultGanacheOptions,
          concurrent: [
            {
              port,
              chainId,
              ganacheOptions2: defaultGanacheOptions,
            },
          ],
        },
        title: this.test.fullTitle(),
      },

      async ({ driver }) => {
        await unlockWallet(driver);

        await openDapp(driver, undefined, DAPP_URL);

        // Connect to dapp
        await driver.findClickableElement({ text: 'Connect', tag: 'button' });
        await driver.clickElement('#connectButton');

        await driver.delay(regularDelayMs);

        await switchToNotificationWindow(driver);

        await driver.clickElement({
          text: 'Connect',
          tag: 'button',
        });

        // Navigate to test dapp
        await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);

        const subscribeRequest = JSON.stringify({
          jsonrpc: '2.0',
          method: 'eth_subscribe',
          params: ['newHeads'],
        });

        const subscribe = await driver.executeScript(
          `return window.ethereum.request(${subscribeRequest})`,
        );

        const subscriptionMessage = await driver.executeAsyncScript(
          `const callback = arguments[arguments.length - 1];` +
            `window.ethereum.on('message', (message) => callback(message))`,
        );

        assert.strictEqual(subscribe, subscriptionMessage.data.subscription);
        assert.strictEqual(subscriptionMessage.type, 'eth_subscription');

        await driver.switchToWindowWithTitle(
          WINDOW_TITLES.ExtensionInFullScreenView,
        );

        // Network Selector
        await driver.clickElement('[data-testid="network-display"]');

        // Switch to second network
        await driver.clickElement({
          text: 'Localhost 8546',
          css: 'p',
        });

        assert.strictEqual(subscribe, subscriptionMessage.data.subscription);
        assert.strictEqual(subscriptionMessage.type, 'eth_subscription');
      },
    );
  });
});
