import { Suite } from 'mocha';
import { Mockttp } from 'mockttp';
import { withFixtures } from '../../helpers';
import { Driver } from '../../webdriver/driver';
import { login } from '../../page-objects/flows/login.flow';
import FixtureBuilderV2 from '../../fixtures/fixture-builder-v2';
import { getProductionRemoteFlagDefaults } from '../../feature-flags/feature-flag-registry';
import { BOTTOM_NAV_AB_TEST_KEY } from '../../../../shared/lib/ab-testing/configs/bottom-nav-bar';
import {
  ACTIVITY_ROUTE,
  CROSS_CHAIN_SWAP_ROUTE,
  PERPS_HOME_PAGE_ROUTE,
} from '../../../../ui/helpers/constants/routes';
import BottomNavBar from '../../page-objects/pages/bottom-nav-bar';
import BridgeQuotePage from '../../page-objects/pages/bridge/quote-page';
import { mockGetPopularTokens } from '../bridge/bridge-test-utils';

/**
 * Fixture config for the bottom nav bar AB test treatment.
 *
 * Sets the feature flag controller with `'treatment'` so the AB test shows
 * the treatment variant.
 *
 * @param title - The test title for debugging.
 * @returns Partial withFixtures config to spread into withFixtures().
 */
function getBottomNavTreatmentFixtures(title?: string) {
  return {
    fixtures: new FixtureBuilderV2()
      .withRemoteFeatureFlagController({
        remoteFeatureFlags: {
          ...getProductionRemoteFlagDefaults(),
          [BOTTOM_NAV_AB_TEST_KEY]: 'treatment',
          perpsEnabledVersion: { enabled: true, minimumVersion: '0.0.1' },
        },
      })
      .build(),
    title,
    manifestFlags: {
      remoteFeatureFlags: {
        [BOTTOM_NAV_AB_TEST_KEY]: 'treatment',
        perpsEnabledVersion: { enabled: true, minimumVersion: '0.0.1' },
      },
    },
    testSpecificMock: async (mockServer: Mockttp) => {
      await mockGetPopularTokens(mockServer);
    },
  };
}

describe('Bottom nav bar', function (this: Suite) {
  this.timeout(120000);

  it('does not show the bottom nav bar when the user is in control', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2().build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await login(driver, { validateBalance: false });

        const bottomNav = new BottomNavBar(driver);
        await bottomNav.assertBottomNavIsNotPresent();
      },
    );
  });

  it('shows the bottom nav bar when the user is in treatment', async function () {
    await withFixtures(
      getBottomNavTreatmentFixtures(this.test?.fullTitle()),
      async ({ driver }: { driver: Driver }) => {
        await login(driver, { validateBalance: false });

        const bottomNav = new BottomNavBar(driver);
        await bottomNav.waitForBottomNavBar();
        await bottomNav.assertOnHomeRoute();
      },
    );
  });

  it('navigates to the swap/bridge page when clicking the swaps tab', async function () {
    await withFixtures(
      getBottomNavTreatmentFixtures(this.test?.fullTitle()),
      async ({ driver }: { driver: Driver }) => {
        await login(driver, { validateBalance: false });

        const bottomNav = new BottomNavBar(driver);
        await bottomNav.waitForBottomNavBar();

        await bottomNav.clickSwaps();
        await bottomNav.assertOnRoute(CROSS_CHAIN_SWAP_ROUTE);

        const bridgePage = new BridgeQuotePage(driver);
        await bridgePage.checkPageIsLoaded();
      },
    );
  });

  it('navigates to the activity page when clicking the activity tab', async function () {
    await withFixtures(
      getBottomNavTreatmentFixtures(this.test?.fullTitle()),
      async ({ driver }: { driver: Driver }) => {
        await login(driver, { validateBalance: false });

        const bottomNav = new BottomNavBar(driver);
        await bottomNav.waitForBottomNavBar();

        await bottomNav.clickActivity();
        await bottomNav.assertOnRoute(ACTIVITY_ROUTE);
      },
    );
  });

  it('navigates back to home when clicking the home tab from the swap page', async function () {
    await withFixtures(
      getBottomNavTreatmentFixtures(this.test?.fullTitle()),
      async ({ driver }: { driver: Driver }) => {
        await login(driver, { validateBalance: false });

        const bottomNav = new BottomNavBar(driver);
        await bottomNav.waitForBottomNavBar();

        await bottomNav.clickSwaps();
        await bottomNav.assertOnRoute(CROSS_CHAIN_SWAP_ROUTE);

        await bottomNav.clickHome();
        await bottomNav.assertOnHomeRoute();
      },
    );
  });

  it('navigates back to home when clicking the home tab from the activity page', async function () {
    await withFixtures(
      getBottomNavTreatmentFixtures(this.test?.fullTitle()),
      async ({ driver }: { driver: Driver }) => {
        await login(driver, { validateBalance: false });

        const bottomNav = new BottomNavBar(driver);
        await bottomNav.waitForBottomNavBar();

        await bottomNav.clickActivity();
        await bottomNav.assertOnRoute(ACTIVITY_ROUTE);

        await bottomNav.clickHome();
        await bottomNav.assertOnHomeRoute();
      },
    );
  });

  it('navigates to the perps page when clicking the perps tab', async function () {
    await withFixtures(
      getBottomNavTreatmentFixtures(this.test?.fullTitle()),
      async ({ driver }: { driver: Driver }) => {
        await login(driver, { validateBalance: false });

        const bottomNav = new BottomNavBar(driver);
        await bottomNav.waitForBottomNavBar();

        await bottomNav.clickPerps();
        await bottomNav.assertOnRoute(PERPS_HOME_PAGE_ROUTE);
      },
    );
  });
});
