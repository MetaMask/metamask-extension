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
          .withPermissionControllerConnectedToTestDapp()
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

        // Switch Ethereum Chain
        await driver.findClickableElement('#switchEthereumChain');
        await driver.clickElement('#switchEthereumChain');

        // Keep notification confirmation on screen
        await driver.waitUntilXWindowHandles(3);

        // Navigate back to test dapp
        await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);

        // Dapp Send Button
        await driver.clickElement('#sendButton');

        await switchToNotificationWindow(driver, 3);

        // Persist Switch Ethereum Chain notifcation
        await driver.findClickableElements({
          text: 'Switch network',
          tag: 'button',
        });

        // Find the cancel pending txs on the Switch Ethereum Chain notification.
        await driver.findElement({
          text: 'Switching networks will cancel all pending confirmations',
          tag: 'span',
        });

        // Confirm Switch Network
        await driver.clickElement({ text: 'Switch network', tag: 'button' });

        // No confirmations, tx should be cleared
        await driver.waitUntilXWindowHandles(2);
      },
    );
  });
});
