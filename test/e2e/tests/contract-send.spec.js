const { strict: assert } = require('assert');
const {
  convertToHexValue,
  withFixtures,
  tinyDelayMs,
  regularDelayMs,
} = require('../helpers');

describe('Deploy contract and call contract methods', function () {
  const ganacheOptions = {
    accounts: [
      {
        secretKey:
          '0x7C9529A67102755B7E6102D6D950AC5D5863C98713805CEC576B945B15B71EAC',
        balance: convertToHexValue(25000000000000000000),
      },
    ],
  };
  it('should display the correct account balance after contract interactions', async function () {
    await withFixtures(
      {
        dapp: true,
        fixtures: 'special-settings',
        ganacheOptions,
        title: this.test.title,
      },
      async ({ driver }) => {
        await driver.navigate();
        await driver.fill('#password', 'correct horse battery staple');
        await driver.press('#password', driver.Key.ENTER);

        // deploy contract
        await driver.openNewPage('http://127.0.0.1:8080/');
        await driver.clickElement({ text: 'Create Token', tag: 'button' });
        await driver.waitUntilXWindowHandles(3);
        const windowHandles = await driver.getAllWindowHandles();
        const extension = windowHandles[0];
        const dapp = await driver.switchToWindowWithTitle(
          'E2E Test Dapp',
          windowHandles,
        );
        // displays the contract creation data
        await driver.switchToWindowWithTitle(
          'MetaMask Notification',
          windowHandles,
        );
        await driver.clickElement({ text: 'Confirm', tag: 'button' });
        await driver.delay(regularDelayMs);

        await driver.switchToWindow(dapp);
        await driver.delay(tinyDelayMs);

        const tokenContractAddress = await driver.waitForSelector({
          css: '#tokenAddress',
          text: '0x',
        });
        const tokenAddress = await tokenContractAddress.getText();

        await driver.switchToWindow(extension);

        await driver.clickElement('[data-testid="eth-overview-send"]');

        await driver.fill(
          'input[placeholder="Search, public address (0x), or ENS"]',
          tokenAddress,
        );

        const inputAmount = await driver.findElement('.unit-input__input');
        await inputAmount.fill('1');

        await driver.fill('textarea[placeholder="Optional', '0x12345');

        await driver.clickElement({ text: 'Next', tag: 'button' });

        await driver.findElement({
          text: `${tokenAddress.slice(0, 5)}...${tokenAddress.slice(
            38,
          )} : CONTRACT INTERACTION}`,
        });

        const transactionAmounts = await driver.findElements(
          '.currency-display-component__text',
        );
        const transactionAmount = transactionAmounts[0];
        assert.equal(await transactionAmount.getText(), '1');
      },
    );
  });
});
