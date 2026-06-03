import { strict as assert } from 'assert';
import { Mockttp } from 'mockttp';
import FixtureBuilderV2 from '../../fixtures/fixture-builder-v2';
import { withFixtures } from '../../helpers';
import { login } from '../../page-objects/flows/login.flow';
import { Driver } from '../../webdriver/driver';
import { MockedEndpoint } from '../../mock-e2e';
import HeaderNavbar from '../../page-objects/pages/header-navbar';
import AccountListPage from '../../page-objects/pages/account-list-page';

const FEATURE_FLAGS_URL = 'https://client-config.api.cx.metamask.io/v1/flags';

const AUTH_URL =
  'https://authentication.api.cx.metamask.io/api/v2/profile/accounts';

const mockRemoteFeatureFlags = () => (mockServer: Mockttp) =>
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

type ProfileAccount = { address: string; scopes: string[] };
type ProfileAccountsPayload = { accounts: ProfileAccount[] };

function isProfileAccountsPayload(
  payload: unknown,
): payload is ProfileAccountsPayload {
  if (
    !payload ||
    typeof payload !== 'object' ||
    !('accounts' in payload) ||
    !Array.isArray(payload.accounts)
  ) {
    return false;
  }

  return payload.accounts.every(
    (account: unknown) =>
      account &&
      typeof account === 'object' &&
      'address' in account &&
      typeof account.address === 'string' &&
      'scopes' in account &&
      Array.isArray(account.scopes) &&
      account.scopes.every((scope: unknown) => typeof scope === 'string'),
  );
}

async function getSeenAuthScopes(
  mockedEndpoint: MockedEndpoint,
): Promise<Set<string>> {
  const scopes = new Set<string>();
  const requests = await mockedEndpoint.getSeenRequests();

  for (const request of requests) {
    const payload = await request.body.getJson();
    if (!isProfileAccountsPayload(payload)) {
      continue;
    }

    for (const account of payload.accounts) {
      for (const scope of account.scopes) {
        scopes.add(scope);
      }
    }
  }

  return scopes;
}

async function waitForScopesToBeSynced(
  driver: Driver,
  mockedEndpoint: MockedEndpoint,
  requiredScopePrefixes: string[],
  timeout = 10000,
) {
  return driver.wait(async () => {
    const seenScopes = await getSeenAuthScopes(mockedEndpoint);
    return requiredScopePrefixes.every((requiredPrefix) =>
      [...seenScopes].some((scope) => scope.startsWith(requiredPrefix)),
    );
  }, timeout);
}

describe('Profile Metrics', function () {
  describe('when MetaMetrics is enabled and the user acknowledged the privacy change', function () {
    it('sends existing accounts to the API on wallet unlock after activating MetaMetrics and an initial delay', async function () {
      await withFixtures(
        {
          fixtures: new FixtureBuilderV2()
            .withMetaMetricsController({
              participateInMetaMetrics: true,
            })
            .build(),
          testSpecificMock: async (server: Mockttp) => [
            await mockAuthService(server),
            await mockRemoteFeatureFlags()(server),
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
          await login(driver);

          const [authCall] = mockedEndpoint;
          // The auth sync sends PUT /profile/accounts payloads shaped as:
          // { metametrics_id, accounts: [{ address, scopes: string[] }, ...] }.
          // Depending on controller timing, account groups can be split across
          // multiple PUTs (e.g. EVM/Solana then Tron/Bitcoin) or consolidated,
          // so this test asserts scope coverage instead of exact request count.
          await waitForScopesToBeSynced(driver, authCall, [
            'eip155:',
            'solana:',
            'tron:',
            'bip122:',
          ]);
        },
      );
    });

    it('sends new accounts to the API when they are created after wallet unlock', async function () {
      await withFixtures(
        {
          fixtures: new FixtureBuilderV2()
            .withMetaMetricsController({
              participateInMetaMetrics: true,
            })
            .build(),
          testSpecificMock: async (server: Mockttp) => [
            await mockAuthService(server),
            await mockRemoteFeatureFlags()(server),
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
          await login(driver);

          const [authCall] = mockedEndpoint;

          // Wait for existing accounts to be synced before creating a new account.
          await waitForScopesToBeSynced(driver, authCall, [
            'eip155:',
            'solana:',
            'tron:',
            'bip122:',
          ]);
          const requestsBeforeAddingAccount = (await authCall.getSeenRequests())
            .length;

          const headerNavbar = new HeaderNavbar(driver);
          await headerNavbar.openAccountMenu();
          const accountListPage = new AccountListPage(driver);
          await accountListPage.checkPageIsLoaded();
          await accountListPage.addMultichainAccount();
          await accountListPage.checkAccountDisplayedInAccountList('Account 2');
          await accountListPage.closeMultichainAccountsPage();

          await waitForEndpointToBeCalled(
            driver,
            authCall,
            requestsBeforeAddingAccount + 1,
          );

          const requests = await authCall.getSeenRequests();
          assert.ok(
            requests.length > requestsBeforeAddingAccount,
            'Expected at least one additional auth API request after creating a new account.',
          );
        },
      );
    });
  });

  [
    {
      title: 'when MetaMetrics is disabled',
      participateInMetaMetrics: false,
      pna25Acknowledged: true,
    },
    {
      title: 'when the user has not acknowledged the privacy change',
      participateInMetaMetrics: true,
      pna25Acknowledged: false,
    },
  ].forEach(({ title, participateInMetaMetrics, pna25Acknowledged }) => {
    describe(title, function () {
      it('does not send existing accounts to the API on wallet unlock', async function () {
        await withFixtures(
          {
            fixtures: new FixtureBuilderV2()
              .withMetaMetricsController({
                participateInMetaMetrics,
              })
              .withAppStateController({
                pna25Acknowledged,
              })
              .build(),
            testSpecificMock: async (server: Mockttp) => [
              await mockAuthService(server),
              await mockRemoteFeatureFlags()(server),
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
            await login(driver);

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
  });
});
