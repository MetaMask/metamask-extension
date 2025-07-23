import { withFixtures, WINDOW_TITLES, largeDelayMs } from '../helpers';
import FixtureBuilder from '../fixture-builder';
import { mockCronjobSnap } from '../mock-response-data/snaps/snap-binary-mocks';
import { loginWithoutBalanceValidation } from '../page-objects/flows/login.flow';
import { Driver } from '../webdriver/driver';
import { openTestSnapClickButtonAndInstall } from '../page-objects/flows/install-test-snap.flow';
import { TestSnaps } from '../page-objects/pages/test-snaps';
import SnapInstall from '../page-objects/pages/dialog/snap-install';

describe('Test Snap Cronjob', function () {
  it('can trigger a cronjob to open a dialog every minute', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        testSpecificMock: mockCronjobSnap,
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await loginWithoutBalanceValidation(driver);
        const testSnaps = new TestSnaps(driver);
        const snapInstall = new SnapInstall(driver);
        await openTestSnapClickButtonAndInstall(
          driver,
          'connectCronJobsButton',
          {
            withExtraScreen: true,
          },
        );
        await testSnaps.check_installationComplete(
          'connectCronJobsButton',
          'Reconnect to Cronjobs Snap',
        );

        await driver.delay(largeDelayMs);

        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

        // look for the dialog popup to verify cronjob fired
        await testSnaps.check_messageResultSpan(
          'snapUIRenderer',
          'This dialog was triggered by a cronjob',
        );

        // try to click on the Ok button and pass test if window closes
        try {
          await snapInstall.clickOkButton();
        } catch (error) {
          console.log('Dialog already closed automatically');
        }
      },
    );
  });
});
