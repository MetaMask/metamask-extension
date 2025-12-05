import { strict as assert } from 'assert';
import { Mockttp } from 'mockttp';
import FixtureBuilder from '../../fixtures/fixture-builder';
import { withFixtures } from '../../helpers';
import { loginWithBalanceValidation } from '../../page-objects/flows/login.flow';
import { Driver } from '../../webdriver/driver';
import { MockedEndpoint } from '../../mock-e2e';
import HeaderNavbar from '../../page-objects/pages/header-navbar';
import AccountListPage from '../../page-objects/pages/account-list-page';
import { ACCOUNT_TYPE } from '../../constants';

const FEATURE_FLAGS_URL = 'https://client-config.api.cx.metamask.io/v1/flags';

const AUTH_URL =
  'https://authentication.api.cx.metamask.io/api/v2/profile/accounts';

/**
 * Mocks the feature flag response for enabling or disabling the feature
 *
 * @param enabled - A boolean indicating whether the feature flag should be enabled or disabled.
 * @returns A function that takes a Mockttp server instance and sets up the mock response.
 */
const mockSendFeatureFlag = (enabled: boolean) => (mockServer: Mockttp) =>
  mockServer
    .forGet(FEATURE_FLAGS_URL)
    .withQuery({
      client: 'extension',
      distribution: 'main',
      environment: 'dev',
    })
    .thenCallback(() => {
      return {
        ok: true,
        statusCode: 200,
        json: [
          {
            extensionUxPna25: enabled,
          },
        ],
      };
    });

/**
 * Mocks the authentication service endpoint for profile metrics.
 *
 * @param mockServer - The Mockttp server instance to set up the mock on.
 * @returns A promise that resolves to the mocked endpoint.
 */
async function mockAuthService(mockServer: Mockttp) {
  return await mockServer.forPut(AUTH_URL).thenCallback(() => {
    return {
      statusCode: 200,
    };
  });
}

/**
 * Waits for the mocked endpoint to be called.
 *
 * @param driver - The WebDriver instance.
 * @param mockedEndpoint - The mocked endpoint to wait for.
 * @param times - The number of times the endpoint should be called. Default is 1.
 * @param timeout - The maximum time to wait in milliseconds. Default is 5000ms.
 * @returns A promise that resolves when the endpoint has been called.
 */
async function waitForEndpointToBeCalled(
  driver: Driver,
  mockedEndpoint: MockedEndpoint,
  times = 1,
  timeout = 5000,
) {
  let calls = 0;
  return driver.wait(async () => {
    calls = (await mockedEndpoint.getSeenRequests()).length;
    return (await mockedEndpoint.isPending()) === false && calls >= times;
  }, timeout);
}

describe('Profile Metrics', function () {
  describe('when MetaMetrics is enabled, the feature flag is on, and the user acknowledged the privacy change', function () {
    it('sends exising accounts to the API on wallet unlock after activating MetaMetrics', async function () {
      await withFixtures(
        {
          fixtures: new FixtureBuilder()
            .withMetaMetricsController({
              participateInMetaMetrics: true,
            })
            .withAppStateController({
              pna25Acknowledged: true,
            })
            .build(),
          testSpecificMock: async (server: Mockttp) => [
            await mockAuthService(server),
            await mockSendFeatureFlag(true)(server),
          ],
          title: this.test?.fullTitle(),
        },
        async ({
          driver,
          mockedEndpoint,
        }: {
          driver: Driver;
          mockedEndpoint: MockedEndpoint[];
        }) => {
          await loginWithBalanceValidation(driver);

          const [authCall] = mockedEndpoint;
          await waitForEndpointToBeCalled(driver, authCall);

          const requests = await authCall.getSeenRequests();
          assert.equal(
            requests.length,
            1,
            'Expected one request to the auth API.',
          );
        },
      );
    });

    it('sends new accounts to the API when they are created after wallet unlock', async function () {
      await withFixtures(
        {
          fixtures: new FixtureBuilder()
            .withMetaMetricsController({
              participateInMetaMetrics: true,
            })
            .withAppStateController({
              pna25Acknowledged: true,
            })
            .build(),
          testSpecificMock: async (server: Mockttp) => [
            await mockAuthService(server),
            await mockSendFeatureFlag(true)(server),
          ],
          title: this.test?.fullTitle(),
        },
        async ({
          driver,
          mockedEndpoint,
        }: {
          driver: Driver;
          mockedEndpoint: MockedEndpoint[];
        }) => {
          await loginWithBalanceValidation(driver);

          const headerNavbar = new HeaderNavbar(driver);
          await headerNavbar.openAccountMenu();
          const accountListPage = new AccountListPage(driver);
          await accountListPage.checkPageIsLoaded();
          await accountListPage.addAccount({
            accountType: ACCOUNT_TYPE.Ethereum,
          });

          const [authCall] = mockedEndpoint;
          await waitForEndpointToBeCalled(driver, authCall, 2);

          const requests = await authCall.getSeenRequests();
          assert.equal(
            requests.length,
            2,
            'Expected two requests to the auth API.',
          );
        },
      );
    });
  });

  [
    {
      title: 'when MetaMetrics is disabled',
      participateInMetaMetrics: false,
      featureFlag: true,
      pna25Acknowledged: true,
    },
    {
      title: 'when the relevant feature flag is off',
      participateInMetaMetrics: true,
      featureFlag: false,
      pna25Acknowledged: true,
    },
    {
      title: 'when the user has not acknowledged the privacy change',
      participateInMetaMetrics: true,
      featureFlag: true,
      pna25Acknowledged: false,
    },
  ].forEach(
    ({ title, participateInMetaMetrics, featureFlag, pna25Acknowledged }) => {
      describe(title, function () {
        it('does not send existing accounts to the API on wallet unlock', async function () {
          await withFixtures(
            {
              fixtures: new FixtureBuilder()
                .withMetaMetricsController({
                  participateInMetaMetrics,
                })
                .withAppStateController({
                  pna25Acknowledged,
                })
                .build(),
              testSpecificMock: async (server: Mockttp) => [
                await mockAuthService(server),
                await mockSendFeatureFlag(featureFlag)(server),
              ],
              title: this.test?.fullTitle(),
            },
            async ({
              driver,
              mockedEndpoint,
            }: {
              driver: Driver;
              mockedEndpoint: MockedEndpoint[];
            }) => {
              await loginWithBalanceValidation(driver);

              await driver.delay(5000);

              const [authCall] = mockedEndpoint;
              const requests = await authCall.getSeenRequests();
              assert.equal(
                requests.length,
                0,
                'Expected no requests to the auth API.',
              );
            },
          );
        });
      });
    },
  );
});
