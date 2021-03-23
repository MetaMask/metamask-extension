const { strict: assert } = require('assert');
const { By, Key } = require('selenium-webdriver');
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
        console.log(111);
        await driver.navigate();
        const passwordField = await driver.findElement(By.css('#password'));
        console.log(222);
        await passwordField.sendKeys('correct horse battery staple');
        await passwordField.sendKeys(Key.ENTER);
        console.log(333);
        const secondaryBalance = await driver.findElement(
          By.css('[data-testid="eth-overview__secondary-currency"]'),
        );
        console.log(444);
        const secondaryBalanceText = await secondaryBalance.getText();
        const [fiatAmount, fiatUnit] = secondaryBalanceText
          .trim()
          .split(/\s+/u);
        console.log(555);
        console.log('fiatAmount', fiatAmount.startsWith('₱'));
        console.log('fiatUnit', fiatUnit === 'PHP');
        assert.ok(fiatAmount.startsWith('₱'));
        assert.equal(fiatUnit, 'PHP');
        console.log(666);
      },
    );
  });
});
