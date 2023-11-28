const { strict: assert } = require('assert');
const {
  withFixtures,
  defaultGanacheOptions,
  unlockWallet,
} = require('../helpers');
const FixtureBuilder = require('../fixture-builder');
const { SMART_CONTRACTS } = require('../seeder/smart-contracts');

describe('Settings', function () {
  const smartContract = SMART_CONTRACTS.ERC1155;
  it('Should match the value of token list item and account list item for eth conversion', async function () {
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder().build(),
        defaultGanacheOptions,
        smartContract,
        title: this.test.fullTitle(),
      },
      async ({ driver }) => {
        await unlockWallet(driver);

        await driver.clickElement('[data-testid="home__asset-tab"]');

        const tokenValue = process.env.MULTICHAIN ? '0\nETH' : '0 ETH';
        const tokenListAmount = await driver.findElement(
          process.env.MULTICHAIN
            ? '[data-testid="token-balance-overview-currency-display"]'
            : '[data-testid="multichain-token-list-item-value"]',
        );
        assert.equal(await tokenListAmount.getText(), tokenValue);

        await driver.clickElement('[data-testid="account-menu-icon"]');
        const accountTokenValue = await driver.waitForSelector(
          '.multichain-account-list-item .currency-display-component__text',
        );

        assert.equal(await accountTokenValue.getText(), '0', 'ETH');
      },
    );
  });

  it('Should match the value of token list item and account list item for fiat conversion', async function () {
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder().build(),
        defaultGanacheOptions,
        smartContract,
        title: this.test.fullTitle(),
      },
      async ({ driver }) => {
        await unlockWallet(driver);

        await driver.clickElement(
          '[data-testid="account-options-menu-button"]',
        );
        await driver.clickElement({ text: 'Settings', tag: 'div' });
        await driver.clickElement({
          text: 'General',
          tag: 'div',
        });
        await driver.clickElement({ text: 'Fiat', tag: 'label' });

        await driver.clickElement(
          '.settings-page__header__title-container__close-button',
        );
        await driver.clickElement('[data-testid="home__asset-tab"]');

        const tokenValue = process.env.MULTICHAIN ? '0\nETH' : '0 ETH';
        const tokenListAmount = await driver.findElement(
          process.env.MULTICHAIN
            ? '[data-testid="token-balance-overview-currency-display"]'
            : '[data-testid="multichain-token-list-item-value"]',
        );
        assert.equal(await tokenListAmount.getText(), tokenValue);

        await driver.clickElement('[data-testid="account-menu-icon"]');
        const accountTokenValue = await driver.waitForSelector(
          '.multichain-account-list-item .currency-display-component__text',
        );

        assert.equal(await accountTokenValue.getText(), '0', 'ETH');
      },
    );
  });
});
