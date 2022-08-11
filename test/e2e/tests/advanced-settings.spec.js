const { strict: assert } = require('assert');
const { convertToHexValue, withFixtures } = require('../helpers');

describe('Advanced Settings', function () {
  const ganacheOptions = {
    accounts: [
      {
        secretKey:
          '0x7C9529A67102755B7E6102D6D950AC5D5863C98713805CEC576B945B15B71EAC',
        balance: convertToHexValue(25000000000000000000),
      },
    ],
  };

  it('should show conversion on test network when activated', async function () {
    await withFixtures(
      {
        dapp: true,
        fixtures: 'imported-account',
        ganacheOptions,
        title: this.test.title,
      },
      async ({ driver }) => {
        await driver.navigate();
        await driver.fill('#password', 'correct horse battery staple');
        await driver.press('#password', driver.Key.ENTER);

        await driver.clickElement('.account-menu__icon');
        await driver.clickElement({ text: 'Settings', tag: 'div' });
        await driver.clickElement({ text: 'Advanced', tag: 'div' });

        await driver.clickElement(
          '[data-testid="advanced-setting-show-testnet-conversion"] label',
        );

        await driver.clickElement(
          '.settings-page__header__title-container__close-button',
        );

        const secondaryCurrency = await driver.findElement(
          '[data-testid="eth-overview__secondary-currency"] .currency-display-component__suffix',
        );
        assert.equal(
          await secondaryCurrency.getText(),
          'USD',
          `Secondary currency is not present`,
        );
      },
    );
  });

  it('should not show conversion on test network when deactivated', async function () {
    await withFixtures(
      {
        dapp: true,
        fixtures: 'imported-account',
        ganacheOptions,
        title: this.test.title,
      },
      async ({ driver }) => {
        await driver.navigate();
        await driver.fill('#password', 'correct horse battery staple');
        await driver.press('#password', driver.Key.ENTER);

        const secondaryCurrency = await driver.isElementPresent(
          '[data-testid="eth-overview__secondary-currency"]',
        );
        assert.equal(secondaryCurrency, false, `Secondary currency is present`);
      },
    );
  });
});
