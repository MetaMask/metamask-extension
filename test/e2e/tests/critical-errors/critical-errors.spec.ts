import { Suite } from 'mocha';
import { withFixtures } from '../../helpers';
import FixtureBuilder from '../../fixtures/fixture-builder';
import CriticalErrorPage from '../../page-objects/pages/critical-error-page';
import { PAGES } from '../../webdriver/driver';
import LoginPage from '../../page-objects/pages/login-page';
import { getManifestVersion } from '../../set-manifest-flags';

const BACKGROUND_CONNECTION_TIMEOUT = 15_000;

describe('Critical errors', function (this: Suite) {
  it('shows critical error screen when background is unresponsive', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        ignoredConsoleErrors: ['Background connection unresponsive'],
        manifestFlags: {
          testing: {
            // Simulate completely unresponsive background
            simulateDelayedBackgroundResponse: true,
          },
        },
        title: this.test?.fullTitle(),
      },
      async ({ driver }) => {
        await driver.navigate(PAGES.HOME, { waitForControllers: false });

        // Wait until timeout expires
        await driver.delay(BACKGROUND_CONNECTION_TIMEOUT);

        const criticalErrorPage = new CriticalErrorPage(driver);
        await criticalErrorPage.checkPageIsLoaded();
        await criticalErrorPage.validateTroubleStartingDescription();
        await criticalErrorPage.validateErrorMessage(
          'Background connection unresponsive',
        );
      },
    );
  });

  it('shows critical error screen when background takes over 15 seconds to respond', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        ignoredConsoleErrors: ['Background connection unresponsive'],
        manifestFlags: {
          testing: {
            // Delay for 100ms longer than timeout, simulating a very slow background response
            simulateDelayedBackgroundResponse:
              BACKGROUND_CONNECTION_TIMEOUT + 100,
          },
        },
        title: this.test?.fullTitle(),
      },
      async ({ driver }) => {
        await driver.navigate(PAGES.HOME, { waitForControllers: false });

        // Wait one additional second after timeout to ensure background has had time to respond,
        // to ensure that the critical error screen remains in place even after the background
        // responds.
        await driver.delay(BACKGROUND_CONNECTION_TIMEOUT + 1_000);

        const criticalErrorPage = new CriticalErrorPage(driver);
        await criticalErrorPage.checkPageIsLoaded();
        await criticalErrorPage.validateTroubleStartingDescription();
        await criticalErrorPage.validateErrorMessage(
          'Background connection unresponsive',
        );
      },
    );
  });
  it('does NOT show critical error screen when background is a "little" slow to respond', async function () {
    // we can skip this test in MV2, since we don't need lazy listeners there
    // as they are installed synchronously in `background.js` anyway.
    if (getManifestVersion() === 2) {
      this.skip();
    }

    const timeoutValue = 5000;
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        ignoredConsoleErrors: ['Background connection unresponsive'],
        manifestFlags: {
          testing: {
            // this causes the background to delay its "ready" signal
            simulatedSlowBackgroundLoadingTimeout: timeoutValue,
          },
        },
        title: this.test?.fullTitle(),
      },
      async ({ driver }) => {
        // immediately navigate to home, which will try to connect to the
        // background right away, even though it isn't ready (because of the
        // simulatedSlowBackgroundLoadingTimeout flag)
        await driver.navigate(PAGES.HOME, { waitForControllers: false });

        // Wait until our "slow" bg timer expires before checking
        await driver.delay(timeoutValue * 1.1);

        const loginPage = new LoginPage(driver);
        await loginPage.checkPageIsLoaded();
      },
    );
  });
});
