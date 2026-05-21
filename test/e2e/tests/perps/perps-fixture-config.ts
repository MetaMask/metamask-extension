import type { Mockttp } from 'mockttp';
import FixtureBuilderV2 from '../../fixtures/fixture-builder-v2';
import {
  getProductionRemoteFlagApiResponse,
  getProductionRemoteFlagDefaults,
} from '../../feature-flags/feature-flag-registry';
import {
  MOCK_ETH_OPEN_LONG_FILL,
  MOCK_ETH_LIMIT_ORDER,
  MOCK_ETH_FUNDING,
  MOCK_USDC_DEPOSIT,
} from './mocks/websocketActivityMocks';

/**
 * Production remote flag defaults used as the base for all perps manifest flag
 * overrides. Starting from these ensures any flag added to the registry is
 * automatically included without having to update this file.
 */
const PROD_REMOTE_FLAGS = getProductionRemoteFlagDefaults();

/**
 * Remote feature flags for eligible (non-geo-blocked) users.
 * Starts from production defaults, enables perps, and clears the geo-block list
 * so US-TX (the E2E geolocation mock) remains eligible.
 */
export const PERPS_ELIGIBLE_FLAG = {
  remoteFeatureFlags: {
    ...PROD_REMOTE_FLAGS,
    perpsEnabledVersion: { enabled: true, minimumVersion: '0.0.0' },
    perpsPerpTradingGeoBlockedCountriesV2: { blockedRegions: [] },
  },
};

/**
 * Remote feature flags for geo-blocked (ineligible) users.
 * The geolocation mock returns 'US-TX', so blocking 'US' makes the user ineligible.
 * EligibilityService.checkEligibility checks geoLocation.startsWith(blockedRegion).
 */
const PERPS_GEO_BLOCKED_FLAG = {
  remoteFeatureFlags: {
    ...PROD_REMOTE_FLAGS,
    perpsEnabledVersion: { enabled: true, minimumVersion: '0.0.0' },
    perpsPerpTradingGeoBlockedCountriesV2: { blockedRegions: ['US'] },
  },
};

/**
 * Perps E2E fixture for geo-block tests: enables perps with geo-block flags and HTTP flag mock.
 * Sets `useExternalServices: false` so eligibility monitoring never starts:
 * without `GeolocationController:getGeolocation` on PerpsControllerMessenger,
 * `refreshEligibility()` would fail and perps-controller would set `isEligible`
 * to true, hiding the geo-block modal. Deferred checks keep `isEligible: false`.
 * Callers must use `login(..., { waitForNonEvmAccounts: false })` because the
 * home flow otherwise waits for non-EVM account icons that do not load when
 * basic functionality is off.
 *
 * Also sets isFirstTimeUser to false so the tutorial modal does not intercept clicks.
 *
 * @param title - The test title (e.g. this.test?.fullTitle()) for debugging.
 * @returns Partial withFixtures config to spread into withFixtures().
 */
export function getPerpsGeoBlockConfig(title?: string) {
  return {
    fixtures: new FixtureBuilderV2()
      .withPerpsController({
        isFirstTimeUser: { mainnet: false, testnet: false },
        isEligible: false,
      })
      .build(),
    title,
    manifestFlags: PERPS_GEO_BLOCKED_FLAG,
    /**
     * Override /v1/flags so the background RemoteFeatureFlagController sees
     * perpsPerpTradingGeoBlockedCountriesV2 with blockedRegions: ['US'].
     * The geolocation mock returns 'US-TX', so startsWith('US') → ineligible.
     *
     * manifestFlags.remoteFeatureFlags only affects the UI selector; the
     * background reads client-config when external services are on. This mock
     * reinforces US blocking for tests that enable eligibility refresh.
     * @param server
     */
    testSpecificMock: async (server: Mockttp) => {
      const geoBlockedFlags = [
        ...getProductionRemoteFlagApiResponse().filter(
          (entry) =>
            !('perpsPerpTradingGeoBlockedCountriesV2' in (entry as object)),
        ),
        { perpsPerpTradingGeoBlockedCountriesV2: { blockedRegions: ['US'] } },
      ];
      await server
        .forGet('https://client-config.api.cx.metamask.io/v1/flags')
        .withQuery({ client: 'extension', distribution: 'main' })
        .thenCallback(() => ({
          ok: true,
          statusCode: 200,
          json: geoBlockedFlags,
        }));
    },
  };
}

/**
 * Registers the eligible feature-flag HTTP mock on `server`.
 * Overrides /v1/flags so the background RemoteFeatureFlagController sees
 * `perpsPerpTradingGeoBlockedCountriesV2` with `blockedRegions: []`,
 * keeping US-TX eligible.
 *
 * Extracted to avoid duplicating this logic across config functions that
 * all need the same flag mock alongside their own additional mocks.
 *
 * @param server - The Mockttp server instance to register the mock on.
 */
async function mockEligibleFeatureFlags(server: Mockttp): Promise<void> {
  const eligibleFlags = [
    ...getProductionRemoteFlagApiResponse().filter(
      (entry) =>
        !('perpsPerpTradingGeoBlockedCountriesV2' in (entry as object)),
    ),
    { perpsPerpTradingGeoBlockedCountriesV2: { blockedRegions: [] } },
  ];
  await server
    .forGet('https://client-config.api.cx.metamask.io/v1/flags')
    .withQuery({ client: 'extension', distribution: 'main' })
    .thenCallback(() => ({
      ok: true,
      statusCode: 200,
      json: eligibleFlags,
    }));
}

/**
 * withFixtures config for Perps E2E tests with an eligible (non-geo-blocked) user.
 * Use this for tests that exercise trading actions (Long/Short, Add Funds, Close All).
 *
 * The geolocation mock returns 'US-TX'. The production default for
 * `perpsPerpTradingGeoBlockedCountriesV2` blocks US, so this config overrides it
 * to `blockedRegions: []` both in `manifestFlags` (UI) and via `testSpecificMock`
 * (background RemoteFeatureFlagController).
 *
 * @param title - The test title for debugging.
 * @returns Partial withFixtures config to spread into withFixtures().
 */
export function getPerpsConfigEligible(title?: string) {
  return {
    fixtures: new FixtureBuilderV2()
      .withPerpsController({
        isEligible: true,
        isFirstTimeUser: { mainnet: false, testnet: false },
      })
      .build(),
    title,
    manifestFlags: PERPS_ELIGIBLE_FLAG,
    testSpecificMock: (server: Mockttp) => mockEligibleFeatureFlags(server),
  };
}

/**
 * withFixtures config for Perps Activity E2E tests.
 *
 * Extends the eligible config by adding HTTP mock overrides for all four
 * activity transaction types. Uses `withJsonBodyIncluding` so only the
 * specific request types are intercepted; everything else (clearinghouseState,
 * meta, allMids, etc.) falls through to the global mock-e2e.js handlers.
 *
 * Activity data injected:
 * - Trades:   one ETH "Open Long" fill  (`userFills`)
 * - Orders:   one ETH Limit buy order   (`openOrders`)
 * - Funding:  one ETH funding payment   (`userFunding`)
 * - Deposits: one USDC deposit entry    (`userNonFundingLedgerUpdates`)
 *
 * @param title - The test title for debugging.
 * @returns Partial withFixtures config to spread into withFixtures().
 */
export function getPerpsConfigEligibleWithActivity(title?: string) {
  return {
    fixtures: new FixtureBuilderV2()
      .withPerpsController({
        isEligible: true,
        isFirstTimeUser: { mainnet: false, testnet: false },
      })
      .build(),
    title,
    manifestFlags: PERPS_ELIGIBLE_FLAG,
    testSpecificMock: async (server: Mockttp) => {
      await mockEligibleFeatureFlags(server);

      // Override userFills — returns an ETH open-long fill for the Trades filter
      await server
        .forPost('https://api.hyperliquid.xyz/info')
        .withJsonBodyIncluding({ type: 'userFills' })
        .thenCallback(() => ({
          statusCode: 200,
          json: [MOCK_ETH_OPEN_LONG_FILL],
        }));

      // Override openOrders — returns an ETH limit buy for the Orders filter
      await server
        .forPost('https://api.hyperliquid.xyz/info')
        .withJsonBodyIncluding({ type: 'openOrders' })
        .thenCallback(() => ({
          statusCode: 200,
          json: [MOCK_ETH_LIMIT_ORDER],
        }));

      // Override userFunding — returns an ETH funding payment for the Funding filter
      await server
        .forPost('https://api.hyperliquid.xyz/info')
        .withJsonBodyIncluding({ type: 'userFunding' })
        .thenCallback(() => ({ statusCode: 200, json: [MOCK_ETH_FUNDING] }));

      // Override userNonFundingLedgerUpdates — returns a USDC deposit for the Deposits filter
      await server
        .forPost('https://api.hyperliquid.xyz/info')
        .withJsonBodyIncluding({ type: 'userNonFundingLedgerUpdates' })
        .thenCallback(() => ({ statusCode: 200, json: [MOCK_USDC_DEPOSIT] }));
    },
  };
}
