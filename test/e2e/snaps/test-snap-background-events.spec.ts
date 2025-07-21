import { mockBackgroundEventsSnap } from '../mock-response-data/snaps/snap-binary-mocks';
import { openTestSnapClickButtonAndInstall } from '../page-objects/flows/install-test-snap.flow';
import { loginWithoutBalanceValidation } from '../page-objects/flows/login.flow';
import { TestSnaps } from '../page-objects/pages/test-snaps';
import { Driver } from '../webdriver/driver';
import { withFixtures, WINDOW_TITLES } from '../helpers';
import FixtureBuilder from '../fixture-builder';

describe('Test Snap Background Events', function () {
  it('can trigger a background event with a date to open a dialog', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        title: this.test?.fullTitle(),
        testSpecificMock: mockBackgroundEventsSnap,
      },
      async ({ driver }: { driver: Driver }) => {
        await loginWithoutBalanceValidation(driver);

        const testSnaps = new TestSnaps(driver);

        // Navigate to test snaps page, connect to background events Snap, complete installation and validate
        await openTestSnapClickButtonAndInstall(
          driver,
          'connectBackgroundEventsButton',
        );
        await testSnaps.check_installationComplete(
          'connectBackgroundEventsButton',
          'Reconnect to Background Events Snap',
        );

        // ISO 8601 date string
        const futureDate = new Date(Date.now() + 5000).toISOString();

        await testSnaps.fillMessage('backgroundEventDateInput', futureDate);

        await testSnaps.clickButton('scheduleBackgroundEventWithDateButton');

        const scheduleResult = await driver.findElement(
          '#scheduleBackgroundEventResult',
        );
        await driver.waitForNonEmptyElement(scheduleResult);

        await testSnaps.clickButton('getBackgroundEventResultButton');

        const eventsResult = await driver.findElement(
          '#getBackgroundEventsResult',
        );
        await driver.waitForNonEmptyElement(eventsResult);

        await testSnaps.check_messageResultSpanIncludes(
          'getBackgroundEventResultSpan',
          'fireDialog',
        );

        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

        // look for the dialog popup to verify background event fired
        await driver.waitForSelector({
          css: '.snap-ui-renderer__content',
          text: 'This dialog was triggered by a background event',
        });

        // try to click on the Ok button and pass test if window closes
        await driver.clickElementAndWaitForWindowToClose({
          text: 'Close',
          tag: 'span',
        });
      },
    );
  });

  it('can trigger a background event with a duration to open a dialog', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        title: this.test?.fullTitle(),
        testSpecificMock: mockBackgroundEventsSnap,
      },
      async ({ driver }: { driver: Driver }) => {
        await loginWithoutBalanceValidation(driver);

        const testSnaps = new TestSnaps(driver);

        // Navigate to test snaps page, connect to background events Snap, complete installation and validate
        await openTestSnapClickButtonAndInstall(
          driver,
          'connectBackgroundEventsButton',
        );

        await testSnaps.check_installationComplete(
          'connectBackgroundEventsButton',
          'Reconnect to Background Events Snap',
        );

        // ISO 8601 duration string
        const futureDuration = 'PT5S';

        await testSnaps.fillMessage(
          'backgroundEventDurationInput',
          futureDuration,
        );

        await testSnaps.clickButton(
          'scheduleBackgroundEventWithDurationButton',
        );

        const scheduleResult = await driver.findElement(
          '#scheduleBackgroundEventResult',
        );
        await driver.waitForNonEmptyElement(scheduleResult);

        await testSnaps.clickButton('getBackgroundEventResultButton');

        const eventsResult = await driver.findElement(
          '#getBackgroundEventsResult',
        );
        await driver.waitForNonEmptyElement(eventsResult);

        await testSnaps.check_messageResultSpanIncludes(
          'getBackgroundEventResultSpan',
          'fireDialog',
        );

        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

        // look for the dialog popup to verify background event fired
        await driver.waitForSelector({
          css: '.snap-ui-renderer__content',
          text: 'This dialog was triggered by a background event',
        });

        // try to click on the Ok button and pass test if window closes
        await driver.clickElementAndWaitForWindowToClose({
          text: 'Close',
          tag: 'span',
        });
      },
    );
  });

  it('can cancel a background event', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        title: this.test?.fullTitle(),
        testSpecificMock: mockBackgroundEventsSnap,
      },
      async ({ driver }: { driver: Driver }) => {
        await loginWithoutBalanceValidation(driver);

        const testSnaps = new TestSnaps(driver);

        await openTestSnapClickButtonAndInstall(
          driver,
          'connectBackgroundEventsButton',
        );
        await testSnaps.check_installationComplete(
          'connectBackgroundEventsButton',
          'Reconnect to Background Events Snap',
        );

        const futureDate = new Date(Date.now() + 5000).toISOString();

        await testSnaps.fillMessage('backgroundEventDateInput', futureDate);

        await testSnaps.clickButton('scheduleBackgroundEventWithDateButton');

        const scheduleResult = await driver.findElement(
          '#scheduleBackgroundEventResult',
        );
        await driver.waitForNonEmptyElement(scheduleResult);

        await testSnaps.clickButton('getBackgroundEventResultButton');

        const eventsResult = await driver.findElement(
          '#getBackgroundEventsResult',
        );
        await driver.waitForNonEmptyElement(eventsResult);

        await testSnaps.check_messageResultSpanIncludes(
          'getBackgroundEventResultSpan',
          'fireDialog',
        );

        const eventIdText = JSON.parse(await scheduleResult.getText());
        await testSnaps.fillMessage('cancelBackgroundEventInput', eventIdText);

        await testSnaps.clickButton('cancelBackgroundEventButton');

        // We don't have a visible event to wait for here, so we just wait a couple seconds.
        await driver.delay(2000);

        await testSnaps.clickButton('getBackgroundEventResultButton');

        await testSnaps.check_messageResultSpan(
          'getBackgroundEventResultSpan',
          '[]',
        );
      },
    );
  });
});
