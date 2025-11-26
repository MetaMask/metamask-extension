import { strict as assert } from 'assert';
import { Mockttp } from 'mockttp';
import FixtureBuilder from '../../fixture-builder';
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
 * @return A function that takes a Mockttp server instance and sets up the mock response.
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
 * @return A promise that resolves to the mocked endpoint.
 */
async function mockAuthService(mockServer: Mockttp) {
  return await mockServer.forPut(AUTH_URL).thenCallback(() => {
    return {
      statusCode: 200,
    };
  });
}

describe('Profile Metrics', function () {
  describe('when MetaMetrics is enabled and the feature flag is on', function () {
    it('sends exising accounts to the API on wallet unlock after activating MetaMetrics', async function () {
      await withFixtures(
        {
          fixtures: new FixtureBuilder()
            .withMetaMetricsController({
              participateInMetaMetrics: true,
            })
            .build(),
          testSpecificMock: async (mockServer: Mockttp) => [
            await mockAuthService(mockServer),
            await mockSendFeatureFlag(true)(mockServer),
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

          await driver.wait(async () => {
            const isPending = await Promise.all(
              mockedEndpoint.map((endpoint) => endpoint.isPending()),
            );
            return isPending.every((pending) => !pending);
          }, 5000);

          const [mockedAuthEndpoint] = mockedEndpoint;
          const requests = await mockedAuthEndpoint.getSeenRequests();
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
            .build(),
          testSpecificMock: async (mockServer: Mockttp) => [
            await mockAuthService(mockServer),
            await mockSendFeatureFlag(true)(mockServer),
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

          await driver.wait(async () => {
            const isPending = await Promise.all(
              mockedEndpoint.map((endpoint) => endpoint.isPending()),
            );
            return isPending.every((pending) => !pending);
          }, 5000);

          const [mockedAuthEndpoint] = mockedEndpoint;
          const requests = await mockedAuthEndpoint.getSeenRequests();
          assert.equal(
            requests.length,
            1,
            'Expected one request to the auth API.',
          );
        },
      );
    });
  });

  describe('when MetaMetrics is disabled or the feature flag is off', function () {
    it('does not send existing accounts to the API on wallet unlock if MetaMetrics is disabled', async function () {
      await withFixtures(
        {
          fixtures: new FixtureBuilder()
            .withMetaMetricsController({
              participateInMetaMetrics: false,
            })
            .build(),
          testSpecificMock: async (mockServer: Mockttp) => [
            await mockAuthService(mockServer),
            await mockSendFeatureFlag(true)(mockServer),
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

          const [mockedAuthEndpoint] = mockedEndpoint;
          const requests = await mockedAuthEndpoint.getSeenRequests();
          assert.equal(
            requests.length,
            0,
            'Expected no requests to the auth API.',
          );
        },
      );
    });

    it('does not send existing accounts to the API on wallet unlock if feature flag is disabled', async function () {
      await withFixtures(
        {
          fixtures: new FixtureBuilder()
            .withMetaMetricsController({
              participateInMetaMetrics: true,
            })
            .build(),
          testSpecificMock: async (mockServer: Mockttp) => [
            await mockAuthService(mockServer),
            await mockSendFeatureFlag(false)(mockServer),
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

          const [mockedAuthEndpoint] = mockedEndpoint;
          const requests = await mockedAuthEndpoint.getSeenRequests();
          assert.equal(
            requests.length,
            0,
            'Expected no requests to the auth API.',
          );
        },
      );
    });
  });
});
