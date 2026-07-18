import { Driver } from '../webdriver/driver';
import { openTestSnapClickButtonAndInstall } from '../page-objects/flows/install-test-snap.flow';
import { TestSnaps } from '../page-objects/pages/test-snaps';
import HeaderNavbar from '../page-objects/pages/header-navbar';
import { withFixtures } from '../helpers';
import FixtureBuilderV2 from '../fixtures/fixture-builder-v2';
import NotificationsListPage from '../page-objects/pages/notifications-list-page';
import NotificationDetailsPage from '../page-objects/pages/notification-details-page';
import { mockNotificationSnap } from '../mock-response-data/snaps/snap-binary-mocks';
import { login } from '../page-objects/flows/login.flow';
import { DAPP_PATH, WINDOW_TITLES } from '../constants';

describe('Test Snap Notification', function () {
  it('can send 1 correctly read in-app notification', async function () {
    await withFixtures(
      {
        dappOptions: {
          customDappPaths: [DAPP_PATH.TEST_SNAPS],
        },
        fixtures: new FixtureBuilderV2()
          .withSnapsPrivacyWarningAlreadyShown()
          .build(),
        testSpecificMock: mockNotificationSnap,
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await login(driver);

        const testSnaps = new TestSnaps(driver);
        const headerNavbar = new HeaderNavbar(driver);
        const notificationsListPage = new NotificationsListPage(driver);

        // Navigate to `test-snaps` page, and install notification Snap.
        await openTestSnapClickButtonAndInstall(
          driver,
          'connectNotificationButton',
        );
        await testSnaps.checkInstallationComplete(
          'connectNotificationButton',
          'Reconnect to Notifications Snap',
        );
        await testSnaps.clickButton('sendInAppNotificationButton');

        // switch back to the extension page and validation one notification appears
        await driver.switchToWindowWithTitle(
          WINDOW_TITLES.ExtensionInFullScreenView,
        );
        await headerNavbar.checkNotificationCountInMenuOption(1);

        // close the drawer by clicking the back button
        await headerNavbar.clickDrawerBackButton();

        // click the notification options and validate the message in the notification list
        await headerNavbar.clickNotificationsOptions();
        await notificationsListPage.checkPageIsLoaded();
        await notificationsListPage.checkSnapsNotificationMessage(
          'Hello from within MetaMask!',
        );
      },
    );
  });

  it('can send in-app notification with expanded view', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2()
          .withSnapsPrivacyWarningAlreadyShown()
          .build(),
        testSpecificMock: mockNotificationSnap,
        dappOptions: {
          customDappPaths: [DAPP_PATH.TEST_SNAPS],
        },
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await login(driver);

        const testSnaps = new TestSnaps(driver);
        const headerNavbar = new HeaderNavbar(driver);
        const notificationsListPage = new NotificationsListPage(driver);
        const notificationDetailsPage = new NotificationDetailsPage(driver);

        // Navigate to `test-snaps` page, and install notification Snap.
        await openTestSnapClickButtonAndInstall(
          driver,
          'connectNotificationButton',
        );
        await testSnaps.checkInstallationComplete(
          'connectNotificationButton',
          'Reconnect to Notifications Snap',
        );
        await testSnaps.clickButton('sendExpandedViewNotificationButton');

        // switch back to the extension page and validation one notification appears
        await driver.switchToWindowWithTitle(
          WINDOW_TITLES.ExtensionInFullScreenView,
        );
        await headerNavbar.checkNotificationCountInMenuOption(1);

        // this click will close the menu
        await headerNavbar.clickDrawerBackButton();

        // click the notification options
        await headerNavbar.clickNotificationsOptions();
        await notificationsListPage.checkPageIsLoaded();
        await notificationsListPage.checkSnapsNotificationMessage(
          'Hello from MetaMask, click here for an expanded view!',
        );
        await notificationsListPage.clickSpecificNotificationMessage(
          'Hello from MetaMask, click here for an expanded view!',
        );
        await notificationDetailsPage.checkExpandedViewIsFullPage();
        await notificationDetailsPage.checkNotificationContent({
          avatarInitial: 'N',
          heading: 'Hello World!',
          markdownText: 'Hello from MetaMask, click here for an expanded view!',
          snapName: 'Notifications Example Snap',
        });
      },
    );
  });
});
