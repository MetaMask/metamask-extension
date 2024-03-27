const { strict: assert } = require('assert');
const {
  defaultGanacheOptions,
  withFixtures,
  openDapp,
  DAPP_URL,
  DAPP_ONE_URL,
  unlockWallet,
  WINDOW_TITLES,
  generateGanacheOptions,
} = require('../../helpers');
const FixtureBuilder = require('../../fixture-builder');

describe('Dapp interactions', function () {
  it('should trigger the add chain confirmation despite MetaMask being locked', async function () {
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder().build(),
        ganacheOptions: generateGanacheOptions({
          concurrent: { port: 8546, chainId: 1338 },
        }),
        title: this.test.fullTitle(),
      },
      async ({ driver }) => {
        await driver.navigate();
        await openDapp(driver);

        // Trigger Notification
        await driver.clickElement('#addEthereumChain');
        await driver.waitUntilXWindowHandles(3);
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
        await unlockWallet(driver);
        const notification = await driver.isElementPresent({
          text: 'Allow this site to add a network?',
          tag: 'h3',
        });

        assert.ok(notification, 'Dapp action does not appear in Metamask');
      },
    );
  });

  it('should connect a second Dapp despite MetaMask being locked', async function () {
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder()
          .withPermissionControllerConnectedToTestDapp()
          .build(),
        ganacheOptions: defaultGanacheOptions,
        dappOptions: { numberOfDapps: 2 },
        title: this.test.fullTitle(),
      },
      async ({ driver }) => {
        await driver.navigate();

        // Connect to 2nd dapp => DAPP_ONE
        await openDapp(driver, null, DAPP_ONE_URL);
        await driver.clickElement({ text: 'Connect', tag: 'button' });
        await driver.waitUntilXWindowHandles(3);

        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

        await unlockWallet(driver, {
          navigate: false,
        });

        await driver.clickElement({ text: 'Next', tag: 'button' });
        await driver.clickElement({ text: 'Connect', tag: 'button' });
        await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);
        await driver.waitForSelector({
          css: '#accounts',
          text: '0x5cfe73b6021e818b776b421b1c4db2474086a7e1',
        });
        // Assert Connection
        await driver.switchToWindowWithTitle(
          WINDOW_TITLES.ExtensionInFullScreenView,
        );
        await unlockWallet(driver, {
          navigate: false,
        });
        await driver.clickElement(
          '[data-testid ="account-options-menu-button"]',
        );

        await driver.clickElement({ text: 'Connected sites', tag: 'div' });

        const connectedDapp1 = await driver.isElementPresent({
          text: DAPP_URL,
          tag: 'bdi',
        });
        const connectedDapp2 = await driver.isElementPresent({
          text: DAPP_ONE_URL,
          tag: 'bdi',
        });

        assert.ok(connectedDapp1, 'Account not connected to Dapp1');
        assert.ok(connectedDapp2, 'Account not connected to Dapp2');
      },
    );
  });
});
