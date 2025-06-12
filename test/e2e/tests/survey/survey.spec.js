const {
  ACCOUNTS_PROD_API_BASE_URL,
} = require('../../../../shared/constants/accounts');
const { MOCK_META_METRICS_ID } = require('../../constants');
const { withFixtures, unlockWallet } = require('../../helpers');
const FixtureBuilder = require('../../fixture-builder');

async function mockSurveys(mockServer) {
  await mockServer
    .forGet(
      `${ACCOUNTS_PROD_API_BASE_URL}/v1/users/${MOCK_META_METRICS_ID}/surveys`,
    )
    // We need to mock this request twice because of a bug on the wallet side (#33604)
    .twice()
    .thenCallback(() => {
      return {
        statusCode: 200,
        json: {
          userId: '0x123',
          surveys: {
            url: 'https://example.com',
            description: `Test survey ${1}`,
            cta: 'Take survey',
            id: 1,
          },
        },
      };
    });
  await mockServer
    .forGet(
      `${ACCOUNTS_PROD_API_BASE_URL}/v1/users/${MOCK_META_METRICS_ID}/surveys`,
    )
    .once()
    .thenCallback(() => {
      return {
        statusCode: 200,
        json: {
          userId: '0x123',
          surveys: {
            url: 'https://example.com',
            description: `Test survey ${2}`,
            cta: 'Take survey',
            id: 2,
          },
        },
      };
    });
}

describe('Test Survey', function () {
  it('should show 2 surveys, and then none', async function () {
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder()
          .withPreferencesController()
          .withMetaMetricsController({
            metaMetricsId: MOCK_META_METRICS_ID,
            participateInMetaMetrics: true,
          })
          .build(),
        testSpecificMock: mockSurveys,
        title: this.test.fullTitle(),
      },
      async ({ driver }) => {
        async function checkForToast(surveyId) {
          await driver.findElement('[data-testid="survey-toast"]');
          await driver.waitForSelector({
            css: '[data-testid="survey-toast-banner-base"] p',
            text: `Test survey ${surveyId}`,
          });
          await driver.clickElement(
            '[data-testid="survey-toast-banner-base"] [aria-label="Close"]',
          );
        }

        async function checkForNoToast() {
          await driver.assertElementNotPresent('[data-testid="survey-toast"]');
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
