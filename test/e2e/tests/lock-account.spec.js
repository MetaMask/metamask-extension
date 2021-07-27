const { strict: assert } = require('assert');
const { withFixtures } = require('../helpers');

describe('Lock and unlock', function () {
  const ganacheOptions = {
    accounts: [
      {
        secretKey:
          '0x7C9529A67102755B7E6102D6D950AC5D5863C98713805CEC576B945B15B71EAC',
        balance: 25000000000000000000,
      },
    ],
  };
  it('successfully unlocks after lock', async function () {
    await withFixtures(
      {
        fixtures: 'imported-account',
        ganacheOptions,
        title: this.test.title,
      },
      async ({ driver }) => {
        await driver.navigate();
        await driver.fill('#password', 'correct horse battery staple');
        await driver.press('#password', driver.Key.ENTER);

        await driver.clickElement('.account-menu__icon');
        const lockButton = await driver.findClickableElement(
          '.account-menu__lock-button',
        );
        assert.equal(await lockButton.getText(), 'Lock');
        await lockButton.click();
        await driver.fill('#password', 'correct horse battery staple');
        await driver.press('#password', driver.Key.ENTER);

        const walletBalance = await driver.findElement(
          '[data-testid="wallet-balance"] .list-item__heading',
        );
        assert.equal(/^25\s*ETH$/u.test(await walletBalance.getText()), true);
      },
    );
  });
});
