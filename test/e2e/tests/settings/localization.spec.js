const { strict: assert } = require('assert');
const {
  defaultGanacheOptions,
  withFixtures,
  unlockWallet,
} = require('../../helpers');
const FixtureBuilder = require('../../fixture-builder');

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
              showNativeTokenAsMainBalance: false,
            },
          })
          .build(),
        ganacheOptions: defaultGanacheOptions,
        title: this.test.fullTitle(),
      },
      async ({ driver }) => {
        await unlockWallet(driver);

        // After the removal of displaying secondary currency in coin-overview.tsx, we will test localization on main balance with showNativeTokenAsMainBalance = false
        const primaryBalance = await driver.findElement(
          '[data-testid="eth-overview__primary-currency"]',
        );
        const balanceText = await primaryBalance.getText();
        const [fiatAmount, fiatUnit] = balanceText.trim().split(/\s+/u);
        assert.ok(fiatAmount.startsWith('₱'));
        assert.equal(fiatUnit, 'PHP');
      },
    );
  });
});
