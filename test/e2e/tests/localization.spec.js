const { strict: assert } = require('assert');
const { Key } = require('selenium-webdriver');
const { withFixtures } = require('../helpers');

describe('Localization', function () {
  it('can correctly display Philippine peso symbol and code', async function () {
    const ganacheOptions = {
      accounts: [
        {
          secretKey:
            '0x7C9529A67102755B7E6102D6D950AC5D5863C98713805CEC576B945B15B71EAC',
          balance: 25000000000000000000,
        },
      ],
    };
    await withFixtures(
      { fixtures: 'localization', ganacheOptions, title: this.test.title },
      async ({ driver }) => {
        await driver.navigate();
        const passwordField = await driver.findElement('#password');
        await passwordField.sendKeys('correct horse battery staple');
        await passwordField.sendKeys(Key.ENTER);
        const secondaryBalance = await driver.findElement(
          '[data-testid="eth-overview__secondary-currency"]',
        );
        const secondaryBalanceText = await secondaryBalance.getText();
        const [fiatAmount, fiatUnit] = secondaryBalanceText
          .trim()
          .split(/\s+/u);
        assert.ok(fiatAmount.startsWith('₱'));
        assert.equal(fiatUnit, 'PHP');
      },
    );
  });
});
