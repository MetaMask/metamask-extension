const { strict: assert } = require('assert');
const {
  defaultGanacheOptions,
  withFixtures,
  unlockWallet,
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
      async ({ driver }) => {
        await unlockWallet(driver);

        const secondaryBalance = await driver.findElement(
          '[data-testid="eth-overview__primary-currency"]',
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
