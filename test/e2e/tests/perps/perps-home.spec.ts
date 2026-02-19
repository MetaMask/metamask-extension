import { Suite } from 'mocha';
import { withFixtures } from '../../helpers';
import { Driver } from '../../webdriver/driver';
import { PAGES } from '../../webdriver/driver';
import FixtureBuilderV2 from '../../fixtures/fixture-builder-v2';
import { loginWithoutBalanceValidation } from '../../page-objects/flows/login.flow';
import { PerpsHomePage } from '../../page-objects/pages/perps/perps-home-page';
import { PERPS_HOME_ROUTE } from './helpers';

/**
 * Perps E2E tests.
 *
 * Uses WebSocket server on localhost:8088 for Hyperliquid calls (redirected via mock-e2e.js).
 * The extension currently uses MockPerpsController - when real PerpsController is integrated,
 * the WebSocket and HTTP mocks will intercept those calls.
 */
describe('Perps', function (this: Suite) {
  this.timeout(120000);

  it('loads Perps Home page when feature flag is enabled', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2().build(),
        title: this.test?.fullTitle(),
        manifestFlags: {
          remoteFeatureFlags: {
            perpsEnabledVersion: {
              enabled: true,
              minimumVersion: '0.0.0',
            },
          },
        },
      },
      async ({ driver }: { driver: Driver }) => {
        await loginWithoutBalanceValidation(driver);

        await driver.navigate(PAGES.HOME);

        await driver.executeScript(
          `window.location.hash = '${PERPS_HOME_ROUTE}';`,
        );

        await driver.delay(2000);

        const perpsHomePage = new PerpsHomePage(driver);
        await perpsHomePage.checkPageIsLoaded();
        await perpsHomePage.checkBackButtonIsVisible();
        await perpsHomePage.checkSearchButtonIsVisible();
      },
    );
  });
});
