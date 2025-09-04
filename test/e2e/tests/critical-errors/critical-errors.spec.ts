import { Suite } from 'mocha';
import { withFixtures } from '../../helpers';
import FixtureBuilder from '../../fixture-builder';
import CriticalErrorPage from '../../page-objects/pages/critical-error-page';
import { PAGES } from '../../webdriver/driver';

describe('Critical errors', function (this: Suite) {
  it('shows critical error screen when background is unresponsive', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        ignoredConsoleErrors: ['Background connection unresponsive'],
        manifestFlags: {
          testing: {
            simulateUnresponsiveBackground: true,
          },
        },
        title: this.test?.fullTitle(),
      },
      async ({ driver }) => {
        await driver.navigate(PAGES.HOME, { waitForControllers: false });

        // Wait until 10 second timer expires
        await driver.delay(10_000);

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
