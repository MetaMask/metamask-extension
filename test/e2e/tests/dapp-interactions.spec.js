const { strict: assert } = require('assert');
const {
  convertToHexValue,
  withFixtures,
  connectToDApp,
  DAPP_URL,
  DAPP_ONE_URL,
} = require('../helpers');
const FixtureBuilder = require('../fixture-builder');

describe('Dapp interactions', function () {
  let windowHandles;
  let extension;
  let popup;
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
        title: this.test.title,
      },
      async ({ driver }) => {
        await driver.navigate();
        await driver.fill('#password', 'correct horse battery staple');
        await driver.press('#password', driver.Key.ENTER);

        await connectToDApp(driver);
        windowHandles = await driver.getAllWindowHandles();
        extension = windowHandles[0];

        // Lock Account
        await driver.switchToWindow(extension);
        await driver.clickElement('.account-menu__icon');
        await driver.clickElement({ text: 'Lock', tag: 'button' });

        // Trigger Notification
        await driver.switchToWindowWithTitle('E2E Test Dapp', windowHandles);
        await driver.clickElement('#addEthereumChain');
        await driver.waitUntilXWindowHandles(3);
        await driver.switchToWindowWithTitle(
          'MetaMask Notification',
          windowHandles,
        );
        await driver.fill('#password', 'correct horse battery staple');
        await driver.press('#password', driver.Key.ENTER);
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
        title: this.test.title,
      },
      async ({ driver }) => {
        await driver.navigate();
        await driver.fill('#password', 'correct horse battery staple');
        await driver.press('#password', driver.Key.ENTER);

        await connectToDApp(driver);
        windowHandles = await driver.getAllWindowHandles();
        extension = windowHandles[0];

        // Lock Account
        await driver.switchToWindow(extension);
        await driver.clickElement('.account-menu__icon');
        await driver.clickElement({ text: 'Lock', tag: 'button' });

        // Connect to Dapp1
        await connectToDApp(driver, null, DAPP_ONE_URL);
        await driver.clickElement({ text: 'Connect', tag: 'button' });
        await driver.waitUntilXWindowHandles(4);
        windowHandles = await driver.getAllWindowHandles();

        popup = await driver.switchToWindowWithTitle(
          'MetaMask Notification',
          windowHandles,
        );

        await driver.switchToWindow(popup);
        await driver.fill('#password', 'correct horse battery staple');
        await driver.press('#password', driver.Key.ENTER);
        await driver.clickElement({ text: 'Next', tag: 'button' });
        await driver.clickElement({ text: 'Connect', tag: 'button' });

        // Assert Connection
        await driver.switchToWindow(extension);
        await driver.fill('#password', 'correct horse battery staple');
        await driver.press('#password', driver.Key.ENTER);
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
