const {
  withFixtures,
  unlockWallet,
  defaultGanacheOptions,
} = require('../../helpers');
const FixtureBuilder = require('../../fixture-builder');

describe('Test Survey', function () {
  it('should show survey, and close it', async function () {
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder()
          .withPreferencesController()
          .withMetaMetricsController({
            metaMetricsId: 'fake-metrics-id-power-user',
            participateInMetaMetrics: true,
          })
          .build(),
        ganacheOptions: defaultGanacheOptions,
        title: this.test.fullTitle(),
      },
      async ({ driver }) => {
        await unlockWallet(driver);
        await driver.findElement('[data-testid="survey-toast"]');
        await driver.clickElement(
          '[data-testid="survey-toast-banner-base"] [aria-label="Close"]',
        );
      },
    );
  });
});

/*
TODO:
Refresh, see no survey
Update a counter to make the mock show a second survey
(ensure the survey toast displays again)
 */
