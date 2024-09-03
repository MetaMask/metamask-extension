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
        fixtures: new FixtureBuilder().build(),
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
});
