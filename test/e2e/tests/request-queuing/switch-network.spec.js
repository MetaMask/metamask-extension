const FixtureBuilder = require('../../fixture-builder');
const {
  withFixtures,
  openDapp,
  unlockWallet,
  DAPP_URL,
  regularDelayMs,
  WINDOW_TITLES,
} = require('../../helpers');
const { PAGES } = require('../../webdriver/driver');

describe('Request Queuing - Extension and Dapp on different networks.', function () {
  it('should not switch to the dapps network automatically when mm network differs', async function () {
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

        // Open dapp
        await openDapp(driver, undefined, DAPP_URL);

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

        await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);

        // Queue confirm tx should first auto switch network
        await driver.clickElement('#sendButton');

        await driver.delay(regularDelayMs);

        await driver.waitUntilXWindowHandles(3);
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

        // Confirm Transaction
        await driver.findClickableElement({ text: 'Confirm', tag: 'button' });
        await driver.clickElement({ text: 'Confirm', tag: 'button' });

        await driver.delay(regularDelayMs);

        // Switch back to the extension
        await driver.switchToWindowWithTitle(
          WINDOW_TITLES.ExtensionInFullScreenView,
        );
        await driver.navigate(PAGES.HOME);

        // Check correct network switched and on the correct network
        await driver.findElement({
          css: '[data-testid="network-display"]',
          text: 'Localhost 8546',
        });
      },
    );
  });
});
