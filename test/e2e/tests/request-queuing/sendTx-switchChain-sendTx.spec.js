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

describe('Request Queuing Send Tx -> SwitchChain -> SendTx', function () {
  // todo: reenable this test once this issue is resolved: https://github.com/MetaMask/MetaMask-planning/issues/2406
  // eslint-disable-next-line mocha/no-skipped-tests
  it.skip('should not be able to navigate batch send txs with a switch chain in the middle', async function () {
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

        await driver.assertElementNotPresent(
          '.confirm-page-container-navigation',
        );

        // Reject Transaction
        await driver.findClickableElement({ text: 'Reject', tag: 'button' });
        await driver.clickElement(
          '[data-testid="page-container-footer-cancel"]',
        );

        // Switch Chain Next confirmation
        await driver.findClickableElements({
          text: 'Switch network',
          tag: 'button',
        });

        // Confirm Switch Chain
        await driver.clickElement({ text: 'Switch network', tag: 'button' });

        // No confirmations, after switching network, tx queue should be cleared
        await driver.waitUntilXWindowHandles(2);
      },
    );
  });
});
