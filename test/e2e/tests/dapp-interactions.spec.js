const { strict: assert } = require('assert');
const {
  convertToHexValue,
  withFixtures,
  connectDappWithExtensionPopup,
} = require('../helpers');

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
        fixtures: 'imported-account',
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

        // Connect to Dapp0
        await connectDappWithExtensionPopup(driver, 0);
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
        fixtures: 'imported-account',
        ganacheOptions,
        dappOptions: { numberOfDapps: 2 },
        title: this.test.title,
      },
      async ({ driver }) => {
        await driver.navigate();
        await driver.fill('#password', 'correct horse battery staple');
        await driver.press('#password', driver.Key.ENTER);

        // Connect to Dapp0
        await connectDappWithExtensionPopup(driver, 0);
        windowHandles = await driver.getAllWindowHandles();
        extension = windowHandles[0];

        // Lock Account
        await driver.switchToWindow(extension);
        await driver.clickElement('.account-menu__icon');
        await driver.clickElement({ text: 'Lock', tag: 'button' });

        // Connect to Dapp1
        await driver.openNewPage('http://127.0.0.1:8081/');
        await driver.clickElement({ text: 'Connect', tag: 'button' });

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
        await driver.clickElement({ text: 'Connected sites', tag: 'span' });
        const connectedDapp1 = await driver.isElementPresent({
          text: 'http://127.0.0.1:8080',
          tag: 'span',
        });
        const connectedDapp2 = await driver.isElementPresent({
          text: 'http://127.0.0.1:8081',
          tag: 'span',
        });

        assert.ok(connectedDapp1, 'Account not connected to Dapp1');
        assert.ok(connectedDapp2, 'Account not connected to Dapp2');
      },
    );
  });
});
