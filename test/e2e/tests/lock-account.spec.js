const { strict: assert } = require('assert');
const { convertToHexValue, withFixtures } = require('../helpers');
const FixtureBuilder = require('../fixture-builder');

describe('Lock and unlock', function () {
  const ganacheOptions = {
    accounts: [
      {
        secretKey:
          '0x7C9529A67102755B7E6102D6D950AC5D5863C98713805CEC576B945B15B71EAC',
        balance: convertToHexValue(25000000000000000000),
      },
    ],
  };
  it('successfully unlocks after lock', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        ganacheOptions,
        title: this.test.title,
      },
      async ({ driver }) => {
        await driver.navigate();
        await driver.fill('#password', 'correct horse battery staple');
        await driver.press('#password', driver.Key.ENTER);

        await driver.clickElement(
          '[data-testid="account-options-menu-button"]',
        );
        const lockButton = await driver.findClickableElement(
          '[data-testid="global-menu-lock"]',
        );
        assert.equal(await lockButton.getText(), 'Lock MetaMask');
        await lockButton.click();
        await driver.fill('#password', 'correct horse battery staple');
        await driver.press('#password', driver.Key.ENTER);

        const walletBalance = await driver.findElement(
          '.eth-overview__primary-balance',
        );
        assert.equal(/^25\s*ETH$/u.test(await walletBalance.getText()), true);
      },
    );
  });
});
