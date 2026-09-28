import { strict as assert } from 'assert';
import { MockedEndpoint, Mockttp } from 'mockttp';
import FixtureBuilderV2 from '../../fixtures/fixture-builder-v2';
import { withFixtures } from '../../helpers';
import { importWalletWithSocialLoginOnboardingFlow } from '../../page-objects/flows/onboarding.flow';
import { OAuthMockttpService } from '../../helpers/seedless-onboarding/mocks';
import { Driver } from '../../webdriver/driver';
import HomePage from '../../page-objects/pages/home/homepage';
import { AuthServer } from '../../helpers/seedless-onboarding/constants';
import { MOCK_GOOGLE_ACCOUNT } from '../../constants';

async function getMockedRequests(
  driver: Driver,
  mockedEndpoints: MockedEndpoint[],
) {
  await driver.wait(
    async () => {
      const pendingStatuses = await Promise.all(
        mockedEndpoints.map((mockedEndpoint) => mockedEndpoint.isPending()),
      );
      return !pendingStatuses.some((pendingStatus) => pendingStatus);
    },
    driver.timeout,
    true,
  );

  const mockedRequests = [];
  for (const mockedEndpoint of mockedEndpoints) {
    mockedRequests.push(...(await mockedEndpoint.getSeenRequests()));
  }

  return mockedRequests;
}

describe('Refresh Auth Tokens (Seedless Onboarding)', function () {
  it('refreshes the auth token when wallet initialization needs an AUS bearer token', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2({ onboarding: true }).build(),
        ignoredConsoleErrors: [
          'The operation cannot be completed while the controller is locked.',
          'Unable to enable notifications',
        ],
        title: this.test?.fullTitle(),
        testSpecificMock: (server: Mockttp) => {
          const oAuthMockttpService = new OAuthMockttpService();
          return oAuthMockttpService.setup(server, {
            forceTokenExpiration: true,
            userEmail: MOCK_GOOGLE_ACCOUNT,
          });
        },
      },
      async ({
        driver,
        mockedEndpoint: mockedEndpoints,
      }: {
        driver: Driver;
        mockedEndpoint: MockedEndpoint[];
      }) => {
        await importWalletWithSocialLoginOnboardingFlow({ driver });
        await new HomePage(driver).checkPageIsLoaded();

        const mockedRequests = await getMockedRequests(driver, mockedEndpoints);
        const tokenRequests = mockedRequests.filter((request) =>
          request.url.includes(AuthServer.RequestToken),
        );
        const grants = await Promise.all(
          tokenRequests.map(async (request) => {
            const body = (await request.body.getJson()) as {
              // eslint-disable-next-line @typescript-eslint/naming-convention
              grant_type?: string;
            };
            return body.grant_type;
          }),
        );

        assert.ok(
          grants.includes('refresh_token'),
          'Expected wallet initialization to refresh the expired auth token',
        );
      },
    );
  });
});
