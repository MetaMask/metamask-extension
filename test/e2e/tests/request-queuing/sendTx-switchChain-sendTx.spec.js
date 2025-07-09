const FixtureBuilder = require('../../fixture-builder');
const {
  withFixtures,
  openDapp,
  unlockWallet,
  DAPP_URL,
  WINDOW_TITLES,
  switchToNotificationWindow,
} = require('../../helpers');

describe('Request Queuing Send Tx -> SwitchChain -> SendTx', function () {
  it('switching network should reject pending confirmations', async function () {
    const port = 8546;
    const chainId = 1338;
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder()
          .withNetworkControllerDoubleNode()
          .withPermissionControllerConnectedToTestDapp()

          .build(),
        localNodeOptions: [
          {
            type: 'anvil',
          },
          {
            type: 'anvil',
            options: {
              port,
              chainId,
            },
          },
        ],
        title: this.test.fullTitle(),
      },

      async ({ driver }) => {
        await unlockWallet(driver);

        await openDapp(driver, undefined, DAPP_URL);

        // Dapp Send Button
        await driver.clickElement('#sendButton');

        // Keep notification confirmation on screen
        await driver.waitUntilXWindowHandles(3);

        // Navigate back to test dapp
        await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);

        // Switch Ethereum Chain
        await driver.findClickableElement('#switchEthereumChain');
        await driver.clickElement('#switchEthereumChain');

        // Navigate back to test dapp
        await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);

        // Dapp Send Button
        await driver.clickElement('#sendButton');

        await switchToNotificationWindow(driver);

        await driver.clickElement(
          '[data-testid="confirm-nav__next-confirmation"]',
        );

        // Confirm Switch Chain
        await driver.clickElement({ text: 'Confirm', tag: 'button' });
        await driver.clickElement('[data-testid="alert-modal-button"]');

        // No confirmations, after switching network, tx queue should be cleared
        await driver.waitUntilXWindowHandles(2);
      },
    );
  });
});
