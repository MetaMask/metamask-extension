const FixtureBuilder = require('../../fixture-builder');
const {
  withFixtures,
  openDapp,
  unlockWallet,
  WINDOW_TITLES,
  defaultGanacheOptions,
  largeDelayMs,
} = require('../../helpers');

describe('Request Queuing SendTx -> SwitchChain (to already permitted, but different chain)', function () {
  it('should not clear pending sendTxs and only change the dapp selected network', async function () {
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

        await openDapp(driver);

        await driver.findClickableElement({ text: 'Connect', tag: 'button' });
        await driver.clickElement('#connectButton');

        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

        await driver.clickElementAndWaitForWindowToClose({
          text: 'Connect',
          tag: 'button',
        });

        await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);

        await driver.findElement({
          css: '[id="chainId"]',
          text: '0x1',
        });

        // Dapp Send Button
        await driver.clickElement('#sendButton');

        await driver.delay(largeDelayMs);

        // Switch Ethereum Chain
        const switchEthereumChainRequest = JSON.stringify({
          jsonrpc: '2.0',
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: '0x53a' }],
        });

        await driver.executeScript(
          `window.ethereum.request(${switchEthereumChainRequest})`,
        );

        await driver.findElement({
          css: '[id="chainId"]',
          text: '0x53a',
        });

        // Check that approval still exists
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

        // Check correct network on confirm tx
        await driver.findElement({
          css: '[data-testid="network-display"]',
          text: 'Mainnet',
        });
      },
    );
  });
});
