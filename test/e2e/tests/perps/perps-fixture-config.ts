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
 * Perps E2E fixture: Perps enabled, geo-block flags, and HTTP flags mock.
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
export function getPerpsConfig(title?: string) {
  return {
    fixtures: new FixtureBuilderV2()
      .withPreferencesController({
        useExternalServices: false,
      })
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
 * Eligibility refresh uses geolocation (`US-TX` in mock-e2e) plus client-config flags; the
 * default E2E `/v1/flags` response clears `perpsPerpTradingGeoBlockedCountriesV2` so users stay
 * eligible (see mock-e2e.js).
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
