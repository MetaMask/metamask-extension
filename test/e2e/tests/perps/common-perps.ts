import { Mockttp, MockedEndpoint } from 'mockttp';
import { withFixtures } from '../../helpers';
import { Driver } from '../../webdriver/driver';
import FixtureBuilder from '../../fixtures/fixture-builder';
import {
  loginWithBalanceValidation,
  loginWithoutBalanceValidation,
} from '../../page-objects/flows/login.flow';

/**
 * Wraps E2E test setup with the perps feature flag enabled
 * and required mocks for running perps tests.
 *
 * Since perps currently uses fully mocked providers inside the extension
 * (mock PerpsController + mock PerpsStreamManager), no external Hyperliquid
 * API mocking is needed yet. When the real controller integration lands,
 * this helper should be extended to set up HTTP/WebSocket mocks similar
 * to how Solana tests redirect calls to localhost:8088.
 */
export async function withPerpsEnabled(
  {
    title,
    withCustomMocks,
    withFixtureBuilder,
  }: {
    title?: string;
    withCustomMocks?: (
      mockServer: Mockttp,
    ) =>
      | Promise<MockedEndpoint[] | MockedEndpoint>
      | MockedEndpoint[]
      | MockedEndpoint;
    withFixtureBuilder?: (builder: FixtureBuilder) => FixtureBuilder;
  },
  test: (driver: Driver, mockServer: Mockttp) => Promise<void>,
) {
  let fixtures = new FixtureBuilder();
  if (withFixtureBuilder) {
    fixtures = withFixtureBuilder(fixtures);
  }

  await withFixtures(
    {
      fixtures: fixtures.build(),
      title,
      manifestFlags: {
        remoteFeatureFlags: {
          perpsEnabledVersion: {
            enabled: true,
            minimumVersion: '0.0.0',
          },
          perpsHip3AllowlistMarkets: 'xyz:*',
        },
      },
      testSpecificMock: async (mockServer: Mockttp) => {
        const mockList: MockedEndpoint[] = [];
        if (withCustomMocks) {
          const customMocksResult = await withCustomMocks(mockServer);
          if (customMocksResult) {
            if (Array.isArray(customMocksResult)) {
              mockList.push(...customMocksResult.filter((m) => m));
            } else {
              mockList.push(customMocksResult);
            }
          }
        }
        return mockList;
      },
      ignoredConsoleErrors: [
        'SES_UNHANDLED_REJECTION: 0, never, undefined, index, Array(1)',
        'SES_UNHANDLED_REJECTION: 1, never, undefined, index, Array(1)',
      ],
    },
    async ({
      driver,
      mockServer,
    }: {
      driver: Driver;
      mockServer: Mockttp;
    }) => {
      await loginWithBalanceValidation(driver);
      await test(driver, mockServer);
    },
  );
}
