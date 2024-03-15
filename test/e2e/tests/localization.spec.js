const { strict: assert } = require('assert');
const {
  defaultGanacheOptions,
  withFixtures,
  logInWithBalanceValidation,
} = require('../helpers');
const FixtureBuilder = require('../fixture-builder');

describe('Localization', function () {
  it('can correctly display Philippine peso symbol and code', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder()
          .withCurrencyController({
            currentCurrency: 'php',
          })
          .withPreferencesController({
            preferences: {
              showFiatInTestnets: true,
            },
          })
          .build(),
        ganacheOptions: defaultGanacheOptions,
        title: this.test.fullTitle(),
      },
      async ({ driver, ganacheServer }) => {
        await logInWithBalanceValidation(driver, ganacheServer);

        await driver.clickElement('[data-testid="home__asset-tab"]');
        const secondaryBalance = await driver.findElement(
          '[data-testid="multichain-token-list-item-value"]',
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
