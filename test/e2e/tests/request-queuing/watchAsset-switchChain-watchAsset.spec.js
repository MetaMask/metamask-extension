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

describe('Request Queue WatchAsset -> SwitchChain -> WatchAsset', function () {
  // todo: reenable this test once this issue is resolved: https://github.com/MetaMask/MetaMask-planning/issues/2406
  // eslint-disable-next-line mocha/no-skipped-tests
  it.skip('should not batch subsequent watchAsset token into first watchAsset confirmation with a switchChain in the middle', async function () {
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

        // Watch Asset 1st call
        await driver.clickElement({
          text: 'Add Token(s) to Wallet',
          tag: 'button',
        });

        await driver.waitUntilXWindowHandles(3);
        await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);

        // Switch Ethereum Chain
        await driver.findClickableElement('#switchEthereumChain');
        await driver.clickElement('#switchEthereumChain');

        await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);

        // Watch Asset 2nd call
        await driver.clickElement({
          text: 'Add Token(s) to Wallet',
          tag: 'button',
        });

        // Wait for token to show in list of tokens to watch
        await driver.delay(regularDelayMs);

        await switchToNotificationWindow(driver);

        const multipleSuggestedtokens = await driver.findElements(
          '.confirm-add-suggested-token__token-list-item',
        );

        // Confirm only 1 token is present in suggested token list
        assert.equal(multipleSuggestedtokens.length, 1);

        await switchToNotificationWindow(driver);

        await driver.clickElement({ text: 'Switch network', tag: 'button' });

        await driver.waitUntilXWindowHandles(2);

        /**
         * Confirm 2nd watchAsset confirmation doesn't pop section
         */
      },
    );
  });
});
