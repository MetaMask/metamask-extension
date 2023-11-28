const { strict: assert } = require('assert');
const {
  convertToHexValue,
  withFixtures,
  openDapp,
  DAPP_URL,
  DAPP_ONE_URL,
  unlockWallet,
  WINDOW_TITLES,
} = require('../helpers');
const FixtureBuilder = require('../fixture-builder');

describe('Dapp interactions', function () {
  const ganacheOptions = {
    accounts: [
      {
        secretKey:
          '0x7C9529A67102755B7E6102D6D950AC5D5863C98713805CEC576B945B15B71EAC',
        balance: convertToHexValue(25000000000000000000),
      },
    ],
  };
  it('should trigger the add chain confirmation despite MetaMask being locked', async function () {
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder().build(),
        ganacheOptions: {
          ...ganacheOptions,
          concurrent: { port: 8546, chainId: 1338 },
        },
        title: this.test.fullTitle(),
      },
      async ({ driver }) => {
        await driver.navigate();
        await openDapp(driver);

        // Trigger Notification
        await driver.clickElement('#addEthereumChain');
        await driver.waitUntilXWindowHandles(3);
        await driver.switchToWindowWithTitle('MetaMask Notification');
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
        ganacheOptions,
        dappOptions: { numberOfDapps: 2 },
        title: this.test.fullTitle(),
      },
      async ({ driver }) => {
        await driver.navigate();

        // Connect to 2nd dapp => DAPP_ONE
        await openDapp(driver, null, DAPP_ONE_URL);
        await driver.clickElement({ text: 'Connect', tag: 'button' });
        await driver.waitUntilXWindowHandles(3);

        await driver.switchToWindowWithTitle(WINDOW_TITLES.Notification);

        await unlockWallet(driver, {
          navigate: false,
          waitLoginSuccess: false,
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
          waitLoginSuccess: false,
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
