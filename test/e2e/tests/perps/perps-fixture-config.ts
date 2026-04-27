import FixtureBuilderV2 from '../../fixtures/fixture-builder-v2';

/**
 * Default withFixtures config for Perps E2E tests (feature flag enabled).
 * Use as base and add title, testSpecificMock, etc. as needed.
 *
 * @param title - The test title (e.g. this.test?.fullTitle()) for debugging.
 * @returns Partial withFixtures config to spread into withFixtures().
 */
export function getPerpsConfig(title?: string) {
  return {
    fixtures: new FixtureBuilderV2().build(),
    title,
    manifestFlags: {
      remoteFeatureFlags: {
        perpsEnabledVersion: {
          enabled: true,
          minimumVersion: '0.0.0',
        },
      },
    },
  };
}
