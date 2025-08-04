const { strict: assert } = require('assert');
const FixtureBuilder = require('../../fixture-builder');
const {
  withFixtures,
  openDapp,
  unlockWallet,
  DAPP_URL,
  WINDOW_TITLES,
} = require('../../helpers');

describe('Request Queue WatchAsset -> SwitchChain -> WatchAsset', function () {
  it('should not batch subsequent watchAsset token into first watchAsset confirmation with a switchChain in the middle', async function () {
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

        // Create Token
        await driver.clickElement({ text: 'Create Token', tag: 'button' });
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
        await driver.clickElement({ text: 'Confirm', tag: 'button' });

        // Wait for token address to populate in dapp
        await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);
        await driver.waitForSelector({
          css: '#erc20TokenAddresses',
          text: '0x581c3C1A2A4EBDE2A0Df29B5cf4c116E42945947',
        });

        // Watch Asset 1st call
        await driver.clickElement({
          text: 'Add Token(s) to Wallet',
          tag: 'button',
        });

        await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);

        // Switch Ethereum Chain
        await driver.clickElement('#switchEthereumChain');

        await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);

        // Watch Asset 2nd call
        await driver.clickElement({
          text: 'Add Token(s) to Wallet',
          tag: 'button',
        });

        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

        // Increasing timeout to potentially fix flakiness
        // Tracking for this issue on:
        // https://github.com/MetaMask/metamask-extension/issues/34800

        // Wait for token to show in list of tokens to watch
        await driver.waitUntil(
          async () => {
            const tokens = await driver.findElements(
              '.confirm-add-suggested-token__token-list-item',
            );
            return tokens.length === 2;
          },
          { timeout: 12500, interval: 100 },
        );

        // Adding a delay to potentially fix flakiness
        await driver.delay(2500);
        const multipleSuggestedtokens = await driver.findElements(
          '.confirm-add-suggested-token__token-list-item',
        );
        // Confirm only 2 tokens are present in suggested token list
        assert.equal(multipleSuggestedtokens.length, 2);
      },
    );
  });
});
