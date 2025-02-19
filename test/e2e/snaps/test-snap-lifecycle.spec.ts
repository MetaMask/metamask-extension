import { Driver } from '../webdriver/driver';
import { TestSnaps } from '../page-objects/pages/test-snaps';
import SnapInstall from '../page-objects/pages/dialog/snap-install';
import FixtureBuilder from '../fixture-builder';
import { loginWithoutBalanceValidation } from '../page-objects/flows/login.flow';
import { withFixtures, WINDOW_TITLES } from '../helpers';

describe('Test Snap Lifecycle Hooks', function () {
  it('can run lifecycle hook on connect', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await loginWithoutBalanceValidation(driver);

        const testSnaps = new TestSnaps(driver);
        const snapInstall = new SnapInstall(driver);

        // Open a new tab and navigate to test snaps page and click life cycle hooks
        await testSnaps.openPage();
        await testSnaps.clickLifeCycleHooksButton();
        await testSnaps.completeSnapInstallConfirmation();
        // Check installation success
        await testSnaps.check_installationComplete(
          testSnaps.connectLifeCycleButton,
          'Reconnect to Lifecycle Hooks Snap',
        );
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
        // Validate the message result in the dialog
        await testSnaps.check_messageResultSpan(
          snapInstall.messageLifeCycleHookSpan,
          'The snap was installed successfully, and the "onInstall" handler was called.',
        );
      },
    );
  });
});
