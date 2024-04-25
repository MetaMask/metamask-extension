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
  largeDelayMs,
} = require('../../helpers');

describe('Request Queue SwitchChain -> WatchAsset', function () {
  it('should clear subsequent watchAsset after switching chain', async function () {
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
          text: 'Next',
          tag: 'button',
          css: '[data-testid="page-container-footer-next"]',
        });

        await driver.clickElement({
          text: 'Confirm',
          tag: 'button',
          css: '[data-testid="page-container-footer-next"]',
        });

        // Wait for Connecting notification to close.
        await driver.waitUntilXWindowHandles(2);

        // Navigate to test dapp
        await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);

        // Create Token
        await driver.clickElement({ text: 'Create Token', tag: 'button' });
        await switchToNotificationWindow(driver);
        await driver.findClickableElement({ text: 'Confirm', tag: 'button' });
        await driver.clickElement({ text: 'Confirm', tag: 'button' });

        // Wait for token address to populate in dapp
        await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);
        await driver.wait(async () => {
          const tokenAddressesElement = await driver.findElement(
            '#tokenAddresses',
          );
          const tokenAddresses = await tokenAddressesElement.getText();
          return tokenAddresses !== '';
        }, 10000);

        // Switch Ethereum Chain
        await driver.findClickableElement('#switchEthereumChain');
        await driver.clickElement('#switchEthereumChain');

        await driver.waitUntilXWindowHandles(3);

        // Delay needed here for firefox, not loading page of switchEthereumChain before clicking the watchAsset button
        // will result in watchAsset being front ran in the window.
        await driver.delay(largeDelayMs);

        // Switch back to test dapp
        await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);

        // Watch Asset
        await driver.clickElement({
          text: 'Add Token(s) to Wallet',
          tag: 'button',
        });

        await switchToNotificationWindow(driver);

        // Confirm Switch Network
        await driver.findClickableElement({
          text: 'Switch network',
          tag: 'button',
        });
        await driver.clickElement({ text: 'Switch network', tag: 'button' });

        await driver.waitUntilXWindowHandles(2);
      },
    );
  });
});
