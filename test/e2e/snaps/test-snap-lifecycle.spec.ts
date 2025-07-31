import { Driver } from '../webdriver/driver';
import { TestSnaps } from '../page-objects/pages/test-snaps';
import SnapInstall from '../page-objects/pages/dialog/snap-install';
import FixtureBuilder from '../fixture-builder';
import { loginWithoutBalanceValidation } from '../page-objects/flows/login.flow';
import {
  unlockWallet,
  withFixtures,
  WINDOW_TITLES,
  veryLargeDelayMs,
} from '../helpers';
import { openTestSnapClickButtonAndInstall } from '../page-objects/flows/install-test-snap.flow';
import { mockLifecycleHooksSnap } from '../mock-response-data/snaps/snap-binary-mocks';

describe('Test Snap Lifecycle Hooks', function () {
  it('runs the `onInstall` lifecycle hook when the Snap is installed', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        testSpecificMock: mockLifecycleHooksSnap,
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await loginWithoutBalanceValidation(driver);

        const testSnaps = new TestSnaps(driver);
        const snapInstall = new SnapInstall(driver);

        // Open a new tab and navigate to test snaps page and click life cycle hooks
        await openTestSnapClickButtonAndInstall(
          driver,
          'connectLifeCycleButton',
          { withExtraScreen: true },
        );
        // Check installation success
        await testSnaps.check_installationComplete(
          'connectLifeCycleButton',
          'Reconnect to Lifecycle Hooks Snap',
        );
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
        // Validate the message result in the dialog
        await snapInstall.check_messageResultSpan(
          snapInstall.lifeCycleHookMessageElement,
          'The Snap was installed successfully, and the "onInstall" handler was called.',
        );
      },
    );
  });

  it('runs the `onStart` lifecycle hook when the client is started', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder()
          .withSnapControllerOnStartLifecycleSnap()
          .build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        // Wait for the dialog to trigger. This avoids race conditions where the
        // dialog may end up queued instead of opened.
        await driver.wait(async () => {
          try {
            // This throws "No client connected to ServerMochaToBackground" if
            // the dialog is not opened.
            await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
            return true;
          } catch {
            return false;
          }
        }, veryLargeDelayMs);

        await unlockWallet(driver, { navigate: false });

        // Validate the "onStart" lifecycle hook message.
        const snapInstall = new SnapInstall(driver);
        await snapInstall.check_messageResultSpan(
          snapInstall.lifeCycleHookMessageElement,
          'The client was started successfully, and the "onStart" handler was called.',
        );
      },
    );
  });
});
