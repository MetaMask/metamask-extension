const { strict: assert } = require('assert');
const {
  withFixtures,
  defaultGanacheOptions,
  openDapp,
  switchToNotificationWindow,
  WINDOW_TITLES,
  DAPP_URL,
  unlockWallet,
} = require('../../helpers');
const FixtureBuilder = require('../../fixture-builder');

describe('Multiple ERC20 Watch Asset', function () {
  // TODO: This assertion will change once the method is fixed.
  it('should show multiple erc20 watchAsset token list, only confirms one bug', async function () {
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder()
          .withPermissionControllerConnectedToTestDapp()
          .build(),
        ganacheOptions: defaultGanacheOptions,
        title: this.test.fullTitle(),
      },
      async ({ driver }) => {
        await unlockWallet(driver);

        await openDapp(driver, undefined, DAPP_URL);

        // Create Token 1
        await driver.clickElement({ text: 'Create Token', tag: 'button' });
        await switchToNotificationWindow(driver);
        await driver.findClickableElement({ text: 'Confirm', tag: 'button' });
        await driver.clickElement({ text: 'Confirm', tag: 'button' });

        // Wait for token 1 address to populate in dapp
        await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);
        await driver.wait(async () => {
          const tokenAddressesElement = await driver.findElement(
            '#tokenAddresses',
          );
          const tokenAddresses = await tokenAddressesElement.getText();
          return tokenAddresses !== '';
        }, 10000);

        // Create Token 2
        await driver.clickElement({ text: 'Create Token', tag: 'button' });
        await switchToNotificationWindow(driver);
        await driver.findClickableElement({ text: 'Confirm', tag: 'button' });
        await driver.clickElement({ text: 'Confirm', tag: 'button' });

        // Wait for token 2 address to populate in dapp
        await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);
        await driver.wait(async () => {
          const tokenAddressesElement = await driver.findElement(
            '#tokenAddresses',
          );
          const tokenAddresses = await tokenAddressesElement.getText();
          return tokenAddresses.split(',').length === 2;
        }, 10000);

        // Create Token 3
        await driver.clickElement({ text: 'Create Token', tag: 'button' });
        await switchToNotificationWindow(driver);
        await driver.findClickableElement({ text: 'Confirm', tag: 'button' });
        await driver.clickElement({ text: 'Confirm', tag: 'button' });

        // Wait for token 3 address to populate in dapp
        await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);
        await driver.wait(async () => {
          const tokenAddressesElement = await driver.findElement(
            '#tokenAddresses',
          );
          const tokenAddresses = await tokenAddressesElement.getText();
          return tokenAddresses.split(',').length === 3;
        }, 10000);

        // Watch all 3 tokens
        await driver.clickElement({
          text: 'Add Token(s) to Wallet',
          tag: 'button',
        });

        // Switch to watchAsset notification
        await switchToNotificationWindow(driver);
        const multipleSuggestedtokens = await driver.findElements(
          '.confirm-add-suggested-token__token-list-item',
        );

        // Confirm all 3 tokens are present as suggested token list
        assert.equal(multipleSuggestedtokens.length, 3);
        await driver.findClickableElement({ text: 'Add token', tag: 'button' });
        await driver.clickElement({ text: 'Add token', tag: 'button' });

        // Switch to fullscreen extension
        await driver.switchToWindowWithTitle(
          WINDOW_TITLES.ExtensionInFullScreenView,
        );

        // Check all three tokens have been added to the token list.
        const addedTokens = await driver.findElements({
          tag: 'span',
          text: 'TST',
        });
        assert.equal(addedTokens.length, 3);
      },
    );
  });
});
