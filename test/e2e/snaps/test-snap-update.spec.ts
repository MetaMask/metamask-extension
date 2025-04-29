import { TestSnaps } from '../page-objects/pages/test-snaps';
import SnapInstall from '../page-objects/pages/dialog/snap-install';
import { Driver } from '../webdriver/driver';
import { withFixtures, WINDOW_TITLES } from '../helpers';
import FixtureBuilder from '../fixture-builder';
import { loginWithoutBalanceValidation } from '../page-objects/flows/login.flow';
import { openTestSnapClickButtonAndInstall } from '../page-objects/flows/install-test-snap.flow';

describe('Test Snap update', function () {
  it('can install an old and then updated version', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await loginWithoutBalanceValidation(driver);

        const testSnaps = new TestSnaps(driver);
        const snapInstall = new SnapInstall(driver);

        // Navigate to test snaps page, connect update, complete installation and validate
        await openTestSnapClickButtonAndInstall(driver, 'connectUpdateButton');
        await testSnaps.check_installationComplete(
          'connectUpdateButton',
          'Reconnect to Update Snap',
        );

        // Click update snap and check the installation status
        await testSnaps.scrollAndClickButton('connectUpdateNewButton');
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
        await driver.waitForSelector({ text: 'Update request' });
        await snapInstall.check_pageIsLoaded();
        await snapInstall.updateScrollAndClickConfirmButton();
        await snapInstall.waitForNextButton();
        await snapInstall.clickNextButton();

        // Switch to test snap page and validate the version text
        await driver.switchToWindowWithTitle(WINDOW_TITLES.TestSnaps);
        await testSnaps.check_messageResultSpan('updateVersionSpan', '"2.1.3"');
      },
    );
  });
});
