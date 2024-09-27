const {
  withFixtures,
  unlockWallet,
  defaultGanacheOptions,
} = require('../../helpers');
const FixtureBuilder = require('../../fixture-builder');

describe('Test Survey', function () {
  async function mockSurveys(mockServer) {
    return await mockServer
      .forGet(
        'https://accounts.api.cx.metamask.io/v1/users/fake-metrics-id/surveys',
      )
      .thenCallback(() => {
        return {
          statusCode: 200,
          body: {
            userId: '0x123',
            surveys: {
              url: 'https://example.com',
              description: 'Test survey',
              cta: 'Take survey',
              id: 1,
            },
          },
        };
      });
  }

  it('should show survey, and close it', async function () {
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder()
          .withPreferencesController()
          .withMetaMetricsController({
            metaMetricsId: 'fake-metrics-id',
            participateInMetaMetrics: true,
            basicFunctionality: false,
          })
          .build(),
        ganacheOptions: defaultGanacheOptions,
        title: this.test.fullTitle(),
        testSpecificMock: mockSurveys,
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
