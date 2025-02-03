const FixtureBuilder = require('../../fixture-builder');
const {
  withFixtures,
  openDapp,
  unlockWallet,
  DAPP_URL,
  DAPP_ONE_URL,
  WINDOW_TITLES,
  defaultGanacheOptions,
} = require('../../helpers');

describe('Request Queuing for Multiple Dapps and Txs on different networks revokePermissions', function () {
  it('should close transaction for revoked permission of eth_accounts but show queued tx from second dapp on a different network.', async function () {
    const port = 8546;
    const chainId = 1338;
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder()
          .withNetworkControllerDoubleGanache()
          .build(),
        dappOptions: { numberOfDapps: 2 },
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

        // Open Dapp One
        await openDapp(driver, undefined, DAPP_URL);

        // Connect to dapp 1
        await driver.clickElement({ text: 'Connect', tag: 'button' });

        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

        await driver.clickElementAndWaitForWindowToClose({
          text: 'Connect',
          tag: 'button',
        });

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

        // Wait for the first dapp's connect confirmation to disappear
        await driver.waitUntilXWindowHandles(2);

        // TODO: Request Queuing bug when opening both dapps at the same time will have them stuck on the same network, with will be incorrect for one of them.
        // Open Dapp Two
        await openDapp(driver, undefined, DAPP_ONE_URL);

        // Connect to dapp 2
        await driver.clickElement({ text: 'Connect', tag: 'button' });

        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

        await driver.clickElementAndWaitForWindowToClose({
          text: 'Connect',
          tag: 'button',
        });

        // Dapp 1 send tx
        await driver.switchToWindowWithUrl(DAPP_URL);
        await driver.findElement({
          css: '[id="chainId"]',
          text: '0x539',
        });
        await driver.clickElement('#sendButton');

        await driver.waitUntilXWindowHandles(4);
        await driver.delay(3000);

        // Dapp 2 send tx
        await driver.switchToWindowWithUrl(DAPP_ONE_URL);
        await driver.findElement({
          css: '[id="chainId"]',
          text: '0x53a',
        });
        await driver.clickElement('#sendButton');
        await driver.waitUntilXWindowHandles(4);

        // Dapp 1 revokePermissions
        await driver.switchToWindowWithUrl(DAPP_URL);
        await driver.findElement({
          css: '[id="chainId"]',
          text: '0x539',
        });
        await driver.assertElementNotPresent({
          css: '[id="chainId"]',
          text: '0x53a',
        });

        // Confirmation will close then reopen
        await driver.clickElement('#revokeAccountsPermission');
        // TODO: find a better way to handle different dialog ids
        await driver.delay(3000);

        // Check correct network on confirm tx.
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

        await driver.findElement({
          css: 'p',
          text: 'Localhost 8546',
        });
      },
    );
  });
});
