const { strict: assert } = require('assert');
const {
  withFixtures,
  unlockWallet,
  defaultGanacheOptions,
} = require('../../helpers');
const FixtureBuilder = require('../../fixture-builder');

describe('Test Survey', function () {
  it('should show 2 surveys, and then none', async function () {
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
        async function checkForToast(surveyId) {
          await driver.findElement('[data-testid="survey-toast"]');
          const surveyElement = await driver.findElement(
            '[data-testid="survey-toast-banner-base"] p',
          );
          const surveyText = await surveyElement.getText();
          assert.equal(
            surveyText,
            `Test survey ${surveyId}`,
            `Survey text should be "Test survey ${surveyId}"`,
          );
          await driver.clickElement(
            '[data-testid="survey-toast-banner-base"] [aria-label="Close"]',
          );
        }

        async function checkForNoToast() {
          const surveyToastAfterRefresh =
            await driver.isElementPresentAndVisible(
              '[data-testid="survey-toast"]',
            );
          assert.equal(
            surveyToastAfterRefresh,
            false,
            'Survey should not be visible after refresh',
          );
        }

        await unlockWallet(driver);
        await checkForToast(1);
        await driver.refresh();
        await checkForToast(2);
        await driver.refresh();
        await checkForNoToast();
      },
    );
  });
});
