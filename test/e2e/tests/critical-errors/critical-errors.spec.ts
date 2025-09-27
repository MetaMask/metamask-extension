import { Suite } from 'mocha';
import { withFixtures } from '../../helpers';
import FixtureBuilder from '../../fixture-builder';
import CriticalErrorPage from '../../page-objects/pages/critical-error-page';
import { PAGES } from '../../webdriver/driver';

const BACKGROUND_CONNECTION_TIMEOUT = 10_000;

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

  it('shows critical error screen when background takes over 10 seconds to respond', async function () {
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
});
