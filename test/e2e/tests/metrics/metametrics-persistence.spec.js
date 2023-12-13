const { strict: assert } = require('assert');
const FixtureBuilder = require('../../fixture-builder');
const {
  withFixtures,
  generateGanacheOptions,
  defaultGanacheOptions,
  unlockWallet,
  genRandInitBal,
  getCleanAppState,
} = require('../../helpers');

describe('MetaMetrics ID persistence', function () {
  it('MetaMetrics ID should persist when the user opts-out and then opts-in again of MetaMetrics collection', async function () {
    const { initialBalanceInHex } = genRandInitBal();

    const initialMetaMetricsId = 'test-metrics-id';

    await withFixtures(
      {
        fixtures: new FixtureBuilder()
          .withMetaMetricsController({
            metaMetricsId: initialMetaMetricsId,
            participateInMetaMetrics: true,
          })
          .build(),
        ganacheOptions: generateGanacheOptions({
          accounts: [
            {
              secretKey: defaultGanacheOptions.accounts[0].secretKey,
              balance: initialBalanceInHex,
            },
          ],
        }),
        title: this.test.fullTitle(),
      },
      async ({ driver }) => {
        await unlockWallet(driver);

        let uiState = await getCleanAppState(driver);

        assert.equal(uiState.metamask.metaMetricsId, initialMetaMetricsId);

        // goes to the settings screen
        await driver.clickElement(
          '[data-testid="account-options-menu-button"]',
        );
        await driver.clickElement({ text: 'Settings', tag: 'div' });
        await driver.clickElement({ text: 'Security & privacy', tag: 'div' });

        // toggle off
        await driver.clickElement(
          '[data-testid="participateInMetaMetrics"] .toggle-button',
        );

        // wait for state to update
        await driver.delay(500);

        uiState = await getCleanAppState(driver);

        assert.equal(
          uiState.metamask.metaMetricsId,
          initialMetaMetricsId,
          'Metametrics ID should be preserved when toggling off metametrics collection',
        );

        // toggle back on
        await driver.clickElement(
          '[data-testid="participateInMetaMetrics"] .toggle-button',
        );

        // wait for state to update
        await driver.delay(500);

        uiState = await getCleanAppState(driver);

        assert.equal(
          uiState.metamask.metaMetricsId,
          initialMetaMetricsId,
          'Metametrics ID should be preserved when toggling on metametrics collection',
        );
      },
    );
  });
});
