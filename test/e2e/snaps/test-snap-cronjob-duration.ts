import { Driver } from '../webdriver/driver';
import { openTestSnapClickButtonAndInstall } from '../page-objects/flows/install-test-snap.flow';
import { TestSnaps } from '../page-objects/pages/test-snaps';
import HeaderNavbar from '../page-objects/pages/header-navbar';
import { withFixtures, unlockWallet, WINDOW_TITLES } from '../helpers';
import FixtureBuilder from '../fixture-builder';
import NotificationsListPage from '../page-objects/pages/notifications-list-page';
import { mockCronjobDurationSnap } from '../mock-response-data/snaps/snap-binary-mocks';

describe('Test Snap Cronjob Duration', function () {
  it('runs a cronjob every 10 seconds that sends a notification', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        testSpecificMock: mockCronjobDurationSnap,
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await unlockWallet(driver);

        const testSnaps = new TestSnaps(driver);
        const headerNavbar = new HeaderNavbar(driver);
        const notificationsListPage = new NotificationsListPage(driver);

        // Navigate to `test-snaps` page, and install cronjob duration Snap.
        await openTestSnapClickButtonAndInstall(
          driver,
          'connectCronjobDurationButton',
        );
        await testSnaps.check_installationComplete(
          'connectCronjobDurationButton',
          'Reconnect to Cronjob Duration Snap',
        );

        // Switch back to the extension page and validation one notification
        // appears.
        await driver.switchToWindowWithTitle(
          WINDOW_TITLES.ExtensionInFullScreenView,
        );
        await headerNavbar.check_notificationCountInMenuOption(1);

        // This click will close the menu.
        await headerNavbar.openThreeDotMenu();

        // Click the notification options and validate the message in the
        // notification list.
        await headerNavbar.clickNotificationsOptions();
        await notificationsListPage.check_pageIsLoaded();
        await notificationsListPage.check_snapsNotificationMessage(
          'This notification was triggered by a cronjob using an ISO 8601 duration.',
        );
      },
    );
  });
});
