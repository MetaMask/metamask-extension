import { MockttpServer } from 'mockttp';
import { ACCOUNTS_PROD_API_BASE_URL } from '../../../../shared/constants/accounts';
import { MOCK_ANALYTICS_ID } from '../../constants';
import { withFixtures } from '../../helpers';
import FixtureBuilderV2 from '../../fixtures/fixture-builder-v2';
import Homepage from '../../page-objects/pages/home/homepage';
import { login } from '../../page-objects/flows/login.flow';

async function mockSurveys(mockServer: MockttpServer) {
  const surveyUrl = `${ACCOUNTS_PROD_API_BASE_URL}/v1/users/${MOCK_ANALYTICS_ID}/surveys`;

  await mockServer
    .forGet(surveyUrl)
    .once()
    .thenCallback(() => {
      return {
        statusCode: 200,
        json: {
          userId: '0x123',
          surveys: {
            url: 'https://example.com',
            description: 'Test survey 1',
            cta: 'Take survey',
            id: 1,
          },
        },
      };
    });

  await mockServer.forGet(surveyUrl).thenCallback(() => {
    return {
      statusCode: 200,
      json: {
        userId: '0x123',
        surveys: {
          url: 'https://example.com',
          description: 'Test survey 2',
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
        dappOptions: { numberOfTestDapps: 1 },
        fixtures: new FixtureBuilderV2()
          .withMetaMetricsController({
            analyticsId: MOCK_ANALYTICS_ID,
            consentDecisionMade: true,
            optedIn: true,
          })
          .build(),
        testSpecificMock: mockSurveys,
        title: this.test?.fullTitle(),
      },
      async ({ driver }) => {
        await login(driver);
        const homePage = new Homepage(driver);
        await homePage.closeSurveyToast('Test survey 1');
        await homePage.closeSurveyToast('Test survey 2');
        await homePage.checkNoSurveyToastIsDisplayed();
      },
    );
  });
});
