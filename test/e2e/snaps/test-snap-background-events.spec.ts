import { openTestSnapClickButtonAndInstall } from "../page-objects/flows/install-test-snap.flow";
import { loginWithoutBalanceValidation } from "../page-objects/flows/login.flow";
import { TestSnaps } from "../page-objects/pages/test-snaps";
import HeaderNavbar from "../page-objects/pages/header-navbar";
import { Driver } from "../webdriver/driver";
import NotificationsListPage from "../page-objects/pages/notifications-list-page";
const {
  withFixtures,
  WINDOW_TITLES,
} = require('../helpers');
const FixtureBuilder = require('../fixture-builder');

describe('Test Snap Background Events', function () {
  it('can trigger a background event with a dateto open a dialog', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        title: this.test.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await loginWithoutBalanceValidation(driver);

        const testSnaps = new TestSnaps(driver);
        const headerNavbar = new HeaderNavbar(driver);
        const notificationsListPage = new NotificationsListPage(driver);

        // Navigate to test snaps page, connect to get-file snap, complete installation and validate
        await openTestSnapClickButtonAndInstall(driver, 'connectCronjobsButton');
        await testSnaps.check_installationComplete(
          'connectCronjobsButton',
          'Reconnect to Cronjobs Snap',
        );

        // ISO 8601 date string
        const futureDate = new Date(Date.now() + 5000).toISOString();

        await testSnaps.fillMessage('backgroundEventDateInput', futureDate);

        await testSnaps.clickButton('scheduleBackgroundEventWithDateButton');

        await testSnaps.clickButton('getBackgroundEventResultButton');

        await testSnaps.check_messageResultSpanIncludes(
          'getBackgroundEventResultSpan',
          'fireNotification',
        );

        // switch back to the extension page and validation one notification appears
        await driver.switchToWindowWithTitle(
          WINDOW_TITLES.ExtensionInFullScreenView,
        );
        await headerNavbar.check_notificationCountInMenuOption(1);

        // this click will close the menu
        await headerNavbar.openThreeDotMenu();

        // click the notification options and validate the message in the notification list
        await headerNavbar.clickNotificationsOptions();
        await notificationsListPage.check_pageIsLoaded();
        await notificationsListPage.check_snapsNotificationMessage(
          'Hello world!',
        );
      },
    );
  });

  it('can trigger a background event with a duration to open a dialog', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        title: this.test.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await loginWithoutBalanceValidation(driver);

        const testSnaps = new TestSnaps(driver);
        const headerNavbar = new HeaderNavbar(driver);
        const notificationsListPage = new NotificationsListPage(driver);

        // Navigate to test snaps page, connect to get-file snap, complete installation and validate
        await openTestSnapClickButtonAndInstall(driver, 'connectCronjobsButton');
        await testSnaps.check_installationComplete(
          'connectCronjobsButton',
          'Reconnect to Cronjobs Snap',
        );

        // ISO 8601 duration string
        const futureDuration = 'PT5S';

        await testSnaps.fillMessage('backgroundEventDurationInput', futureDuration);

        await testSnaps.clickButton('scheduleBackgroundEventWithDurationButton');

        await testSnaps.clickButton('getBackgroundEventResultButton');

        await testSnaps.check_messageResultSpanIncludes(
          'getBackgroundEventResultSpan',
          'fireNotification',
        );

        // switch back to the extension page and validation one notification appears
        await driver.switchToWindowWithTitle(
          WINDOW_TITLES.ExtensionInFullScreenView,
        );
        await headerNavbar.check_notificationCountInMenuOption(1);

        // this click will close the menu
        await headerNavbar.openThreeDotMenu();

        // click the notification options and validate the message in the notification list
        await headerNavbar.clickNotificationsOptions();
        await notificationsListPage.check_pageIsLoaded();
        await notificationsListPage.check_snapsNotificationMessage(
          'Hello world!',
        );
      },
    );
  });

  it('can cancel a background event', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        title: this.test.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await loginWithoutBalanceValidation(driver);

        const testSnaps = new TestSnaps(driver);

        await openTestSnapClickButtonAndInstall(driver, 'connectCronjobsButton');
        await testSnaps.check_installationComplete(
          'connectCronjobsButton',
          'Reconnect to Cronjobs Snap',
        );

        const futureDate = new Date(Date.now() + 5000).toISOString();

        await testSnaps.fillMessage('backgroundEventDateInput', futureDate);

        await testSnaps.clickButton('scheduleBackgroundEventWithDateButton');

        await testSnaps.clickButton('getBackgroundEventResultButton');

        await testSnaps.check_messageResultSpanIncludes(
          'getBackgroundEventResultSpan',
          'fireNotification',
        );

        const eventId = await this.driver.findElement('#scheduleBackgroundEventResult');
        const eventIdContent = await eventId.getAttribute('textContent');
        const eventIdText = JSON.parse(eventIdContent);
        await testSnaps.fillMessage('cancelBackgroundEventInput', eventIdText);

        await testSnaps.clickButton('cancelBackgroundEventButton');
        await testSnaps.clickButton('getBackgroundEventResultButton');

        await testSnaps.check_messageResultSpan(
          'getBackgroundEventResultSpan',
          '',
        );
      },
    );
  });
});
