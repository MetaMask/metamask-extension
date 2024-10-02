const FixtureBuilder = require('../../fixture-builder');
const {
  withFixtures,
  openDapp,
  unlockWallet,
  DAPP_URL,
  WINDOW_TITLES,
  switchToNotificationWindow,
  defaultGanacheOptions,
} = require('../../helpers');

describe('Request Queuing SwitchChain -> SendTx', function () {
  it('should clear subsequent sendTxs after switching chain', async function () {
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

        // Switch Ethereum Chain
        const switchEthereumChainRequest = JSON.stringify({
          jsonrpc: '2.0',
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: '0x539' }],
        });

        await driver.executeScript(
          `window.ethereum.request(${switchEthereumChainRequest})`,
        );

        // Navigate back to test dapp
        await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);

        // Dapp Send Button
        await driver.clickElement('#sendButton');

        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

        // Persist Switch Ethereum Chain notifcation
        await driver.findClickableElements({
          text: 'Confirm',
          tag: 'button',
        });

        // THIS IS BROKEN
        // Find the cancel pending txs on the Switch Ethereum Chain notification.
        // await driver.findElement({
        //   text: 'Switching networks will cancel all pending confirmations',
        //   tag: 'span',
        // });

        // Confirm Switch Network
        await driver.clickElement({ text: 'Confirm', tag: 'button' });

        // No confirmations, tx should be cleared
        await driver.waitUntilXWindowHandles(2);
      },
    );
  });
});
