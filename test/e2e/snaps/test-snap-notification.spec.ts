import { strict as assert } from 'assert';
import { Driver } from '../webdriver/driver';
import { openTestSnapClickButtonAndInstall } from '../page-objects/flows/install-test-snap.flow';
import { TestSnaps } from '../page-objects/pages/test-snaps';
import HeaderNavbar from '../page-objects/pages/header-navbar';
import { withFixtures, unlockWallet, WINDOW_TITLES } from '../helpers';
import FixtureBuilder from '../fixture-builder';
import NotificationsListPage from '../page-objects/pages/notifications-list-page';
import { mockNotificationSnap } from '../mock-response-data/snaps/snap-binary-mocks';

describe('Test Snap Notification', function () {
  it('can send 1 correctly read in-app notification', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        testSpecificMock: mockNotificationSnap,
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await unlockWallet(driver);

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

        // this click will close the menu
        await headerNavbar.openThreeDotMenu();

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
        fixtures: new FixtureBuilder().build(),
        testSpecificMock: mockNotificationSnap,
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await unlockWallet(driver);

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
        await testSnaps.clickButton('sendExpandedViewNotificationButton');

        // switch back to the extension page and validation one notification appears
        await driver.switchToWindowWithTitle(
          WINDOW_TITLES.ExtensionInFullScreenView,
        );
        await headerNavbar.checkNotificationCountInMenuOption(1);

        // this click will close the menu
        await headerNavbar.openThreeDotMenu();

        // click the notification options
        await headerNavbar.clickNotificationsOptions();
        await notificationsListPage.checkPageIsLoaded();
        await notificationsListPage.checkSnapsNotificationMessage(
          'Hello from MetaMask, click here for an expanded view!',
        );
        await notificationsListPage.clickSpecificNotificationMessage(
          'Hello from MetaMask, click here for an expanded view!',
        );
        await validateExpandedViewNotification(driver);
        await validateNotificationDetails(driver);
      },
    );
  });
});

async function validateExpandedViewNotification(driver: Driver) {
  console.log('Validating expanded view notification');
  const element = await driver.findElement('[data-testid="multichain-page"]');
  assert.equal((await element.getAttribute('class')).includes('-full'), true);
}

async function validateNotificationDetails(driver: Driver) {
  console.log('Validating notification details');

  await driver.waitForSelector({
    css: '.mm-text--heading-sm',
    text: 'Hello World!',
  });

  await driver.waitForSelector({
    css: '.mm-avatar-base--size-xl',
    text: 'N',
  });

  await driver.waitForSelector({
    css: '.mm-text--body-md',
    text: 'Notifications Example Snap',
  });

  await driver.waitForSelector({
    css: '[data-testid="snap-ui-markdown-text"]',
    text: 'Hello from MetaMask, click here for an expanded view!',
  });
}
