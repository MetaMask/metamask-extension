const { strict: assert } = require('assert');
const { convertToHexValue, withFixtures } = require('../helpers');

describe('Send ERC20 token to contract address', function () {
  const ganacheOptions = {
    accounts: [
      {
        secretKey:
          '0x7C9529A67102755B7E6102D6D950AC5D5863C98713805CEC576B945B15B71EAC',
        balance: convertToHexValue(25000000000000000000),
      },
    ],
  };
  it('should display the token contract warning to the user', async function () {
    await withFixtures(
      {
        dapp: true,
        fixtures: 'connected-state',
        ganacheOptions,
        title: this.test.title,
        failOnConsoleError: false,
      },
      async ({ driver }) => {
        await driver.navigate();
        await driver.fill('#password', 'correct horse battery staple');
        await driver.press('#password', driver.Key.ENTER);

        // Create TST
        await driver.openNewPage('http://127.0.0.1:8080/');
        await driver.clickElement('#createToken');
        await driver.waitUntilXWindowHandles(3);
        let windowHandles = await driver.getAllWindowHandles();
        const extension = windowHandles[0];
        const dapp = await driver.switchToWindowWithTitle(
          'E2E Test Dapp',
          windowHandles,
        );
        await driver.switchToWindowWithTitle(
          'MetaMask Notification',
          windowHandles,
        );
        await driver.clickElement({ text: 'Confirm', tag: 'button' });
        await driver.waitUntilXWindowHandles(2);
        await driver.switchToWindow(dapp);
        const tokenAddress = await driver.waitForSelector({
          css: '#tokenAddress',
          text: '0x',
        });
        const tokenAddressText = await tokenAddress.getText();

        // Add token
        await driver.switchToWindow(dapp);
        await driver.clickElement('#watchAsset');
        await driver.waitUntilXWindowHandles(3);
        windowHandles = await driver.getAllWindowHandles();
        await driver.switchToWindowWithTitle(
          'MetaMask Notification',
          windowHandles,
        );
        await driver.clickElement({ text: 'Add Token', tag: 'button' });
        await driver.waitUntilXWindowHandles(2);
        await driver.switchToWindow(extension);

        // Send TST
        await driver.clickElement('[data-testid="home__asset-tab"]');
        await driver.clickElement('.token-cell');
        await driver.clickElement('[data-testid="eth-overview-send"]');

        // Type contract address
        await driver.fill(
          'input[placeholder="Search, public address (0x), or ENS"]',
          tokenAddressText,
        );

        // Verify warning
        const warningText =
          'Warning: you are about to send to a token contract which could result in a loss of funds. Learn more\nI understand';
        const warning = await driver.findElement('.send__warning-container');
        assert.equal(await warning.getText(), warningText);
      },
    );
  });
});
