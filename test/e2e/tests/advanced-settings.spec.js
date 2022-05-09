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

  it('should show conversion on test networks when activated', async function () {
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

        // Ropsten
        await driver.clickElement('.app-header__network-component-wrapper div');
        await driver.clickElement({
          text: 'Ropsten Test Network',
          tag: 'span',
        });

        let secondaryCurrency = await driver.isElementPresent(
          '[data-testid="eth-overview__secondary-currency"]',
        );
        assert.equal(await secondaryCurrency, true);

        // Kovan
        await driver.clickElement('.app-header__network-component-wrapper div');
        await driver.clickElement({ text: 'Kovan Test Network', tag: 'span' });

        secondaryCurrency = await driver.isElementPresent(
          '[data-testid="eth-overview__secondary-currency"]',
        );
        assert.equal(await secondaryCurrency, true);

        // Rinkeby
        await driver.clickElement('.app-header__network-component-wrapper div');
        await driver.clickElement({
          text: 'Rinkeby Test Network',
          tag: 'span',
        });

        secondaryCurrency = await driver.isElementPresent(
          '[data-testid="eth-overview__secondary-currency"]',
        );
        assert.equal(await secondaryCurrency, true);

        // Goerli
        await driver.clickElement('.app-header__network-component-wrapper div');
        await driver.clickElement({ text: 'Goerli Test Network', tag: 'span' });

        secondaryCurrency = await driver.isElementPresent(
          '[data-testid="eth-overview__secondary-currency"]',
        );
        assert.equal(await secondaryCurrency, true);
      },
    );
  });

  it('should not show conversion on test networks when deactivated', async function () {
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

        // Ropsten
        await driver.clickElement('.app-header__network-component-wrapper div');
        await driver.clickElement({
          text: 'Ropsten Test Network',
          tag: 'span',
        });

        let secondaryCurrency = await driver.isElementPresent(
          '[data-testid="eth-overview__secondary-currency"]',
        );
        assert.equal(await secondaryCurrency, false);

        // Kovan
        await driver.clickElement('.app-header__network-component-wrapper div');
        await driver.clickElement({ text: 'Kovan Test Network', tag: 'span' });

        secondaryCurrency = await driver.isElementPresent(
          '[data-testid="eth-overview__secondary-currency"]',
        );
        assert.equal(await secondaryCurrency, false);

        // Rinkeby
        await driver.clickElement('.app-header__network-component-wrapper div');
        await driver.clickElement({
          text: 'Rinkeby Test Network',
          tag: 'span',
        });

        secondaryCurrency = await driver.isElementPresent(
          '[data-testid="eth-overview__secondary-currency"]',
        );
        assert.equal(await secondaryCurrency, false);

        // Goerli
        await driver.clickElement('.app-header__network-component-wrapper div');
        await driver.clickElement({ text: 'Goerli Test Network', tag: 'span' });

        secondaryCurrency = await driver.isElementPresent(
          '[data-testid="eth-overview__secondary-currency"]',
        );
        assert.equal(await secondaryCurrency, false);
      },
    );
  });
});
