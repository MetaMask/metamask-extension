import type { Mockttp } from 'mockttp';
import FixtureBuilderV2 from '../../fixtures/fixture-builder-v2';
import { getProductionRemoteFlagApiResponse } from '../../feature-flags/feature-flag-registry';

const PERPS_ENABLED_FLAG = {
  remoteFeatureFlags: {
    perpsEnabledVersion: {
      enabled: true,
      minimumVersion: '0.0.0',
    },
  },
};

/**
 * Remote feature flags for geo-blocked (ineligible) users.
 * The geolocation mock returns 'US-TX', so blocking 'US' makes the user ineligible.
 * EligibilityService.checkEligibility checks geoLocation.startsWith(blockedRegion).
 */
const PERPS_GEO_BLOCKED_FLAG = {
  remoteFeatureFlags: {
    ...PERPS_ENABLED_FLAG.remoteFeatureFlags,
    perpsPerpTradingGeoBlockedCountriesV2: {
      blockedRegions: ['US'],
    },
  },
};

/**
 * Default withFixtures config for Perps E2E tests (feature flag enabled).
 * Sets isFirstTimeUser to false to prevent the tutorial modal from auto-opening
 * and potentially intercepting clicks in tests that don't cover the tutorial flow.
 *
 * @param title - The test title (e.g. this.test?.fullTitle()) for debugging.
 * @returns Partial withFixtures config to spread into withFixtures().
 */
export function getPerpsConfig(title?: string) {
  return {
    fixtures: new FixtureBuilderV2()
      .withPerpsController({
        isFirstTimeUser: { mainnet: false, testnet: false },
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
     * background controller reads from the HTTP endpoint, which is why this
     * testSpecificMock is required for the geo-block to take effect.
     */
    testSpecificMock: async (server: Mockttp) => {
      const geoBlockedFlags = [
        ...getProductionRemoteFlagApiResponse(),
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
 * withFixtures config for Perps E2E tests with an eligible (non-geo-blocked) user.
 * Use this for tests that exercise trading actions (Long/Short, Add Funds, Close All).
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
    manifestFlags: PERPS_ENABLED_FLAG,
  };
}
