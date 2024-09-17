const { strict: assert } = require('assert');
const {
  withFixtures,
  defaultGanacheOptions,
  logInWithBalanceValidation,
} = require('../../helpers');

const FixtureBuilder = require('../../fixture-builder');

describe('Settings', function () {
  it('Should match the value of token list item and account list item for eth conversion', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().withConversionRateDisabled().build(),
        ganacheOptions: defaultGanacheOptions,
        title: this.test.fullTitle(),
      },
      async ({ driver, ganacheServer }) => {
        await logInWithBalanceValidation(driver, ganacheServer);

        await driver.clickElement(
          '[data-testid="account-overview__asset-tab"]',
        );
        const tokenValue = '25 ETH';
        const tokenListAmount = await driver.findElement(
          '[data-testid="multichain-token-list-item-value"]',
        );
        await driver.waitForNonEmptyElement(tokenListAmount);
        assert.equal(await tokenListAmount.getText(), tokenValue);

        await driver.clickElement('[data-testid="account-menu-icon"]');
        const accountTokenValue = await driver.waitForSelector(
          '.multichain-account-list-item .multichain-account-list-item__avatar-currency .currency-display-component__text',
        );

        assert.equal(await accountTokenValue.getText(), '25', 'ETH');
      },
    );
  });

  it('Should match the value of token list item and account list item for fiat conversion', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().withConversionRateEnabled().build(),
        ganacheOptions: defaultGanacheOptions,
        title: this.test.fullTitle(),
      },
      async ({ driver, ganacheServer }) => {
        await logInWithBalanceValidation(driver, ganacheServer);

        await driver.clickElement(
          '[data-testid="account-options-menu-button"]',
        );
        await driver.clickElement({ text: 'Settings', tag: 'div' });
        await driver.clickElement({
          text: 'General',
          tag: 'div',
        });
        await driver.clickElement('.show-native-token-as-main-balance');
        // We now need to enable "Show fiat on testnet" if we are using testnets (and since our custom
        // network during test is using a testnet chain ID, it will be considered as a test network)
        await driver.clickElement({
          text: 'Advanced',
          tag: 'div',
        });
        await driver.clickElement('.show-fiat-on-testnets-toggle');
        // Looks like when enabling the "Show fiat on testnet" it takes some time to re-update the
        // overview screen, so just wait a bit here:
        await driver.delay(1000);

        await driver.clickElement(
          '.settings-page__header__title-container__close-button',
        );
        await driver.clickElement(
          '[data-testid="account-overview__asset-tab"]',
        );

        const tokenListAmount = await driver.findElement(
          '.eth-overview__primary-container',
        );
        await driver.delay(1000);
        assert.equal(await tokenListAmount.getText(), '$42,500.00USD');
        await driver.clickElement('[data-testid="account-menu-icon"]');
        const accountTokenValue = await driver.waitForSelector(
          '.multichain-account-list-item .multichain-account-list-item__asset',
        );

        assert.equal(await accountTokenValue.getText(), '$42,500.00USD');
      },
    );
  });
});
