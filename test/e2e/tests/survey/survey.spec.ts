import { MockttpServer } from 'mockttp';
import { ACCOUNTS_PROD_API_BASE_URL } from '../../../../shared/constants/accounts';
import { MOCK_META_METRICS_ID } from '../../constants';
import { withFixtures } from '../../helpers';
import FixtureBuilder from '../../fixture-builder';
import Homepage from '../../page-objects/pages/home/homepage';
import { loginWithBalanceValidation } from '../../page-objects/flows/login.flow';

async function mockSurveys(mockServer: MockttpServer) {
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
        title: this.test?.fullTitle(),
      },
      async ({ driver }) => {
        await loginWithBalanceValidation(driver);
        const homePage = new Homepage(driver);
        await homePage.closeSurveyToast('Test survey 1');
        await homePage.closeSurveyToast('Test survey 2');
        await homePage.checkNoSurveyToastIsDisplayed();
      },
    );
  });
});
