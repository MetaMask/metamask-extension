import { mockBackgroundEventsSnap } from '../mock-response-data/snaps/snap-binary-mocks';
import { openTestSnapClickButtonAndInstall } from '../page-objects/flows/install-test-snap.flow';
import { loginWithoutBalanceValidation } from '../page-objects/flows/login.flow';
import { TestSnaps } from '../page-objects/pages/test-snaps';
import { Driver } from '../webdriver/driver';
import { DAPP_PATH, WINDOW_TITLES } from '../constants';
import { withFixtures } from '../helpers';
import FixtureBuilder from '../fixtures/fixture-builder';

describe('Test Snap Background Events', function () {
  it('can trigger a background event with a date to open a dialog', async function () {
    await withFixtures(
      {
        dappOptions: {
          customDappPaths: [DAPP_PATH.TEST_SNAPS],
        },
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
          'clickConnectBackgroundEventsButton',
        );
        await testSnaps.checkConnectBackgroundEventsButtonText(
          'Reconnect to Background Events Snap',
        );

        // ISO 8601 date string
        const futureDate = new Date(Date.now() + 5000).toISOString();

        await testSnaps.fillBackgroundEventDateInput(futureDate);

        await testSnaps.clickScheduleBackgroundEventWithDateButton();

        const scheduleResult = await driver.findElement(
          '#scheduleBackgroundEventResult',
        );
        await driver.waitForNonEmptyElement(scheduleResult);

        await testSnaps.clickGetBackgroundEventResultButton();

        const eventsResult = await driver.findElement(
          '#getBackgroundEventsResult',
        );
        await driver.waitForNonEmptyElement(eventsResult);

        await testSnaps.checkGetBackgroundEventResultIncludes('fireDialog');

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
        dappOptions: {
          customDappPaths: [DAPP_PATH.TEST_SNAPS],
        },
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
          'clickConnectBackgroundEventsButton',
        );

        await testSnaps.checkConnectBackgroundEventsButtonText(
          'Reconnect to Background Events Snap',
        );

        // ISO 8601 duration string
        const futureDuration = 'PT5S';

        await testSnaps.fillBackgroundEventDurationInput(futureDuration);

        await testSnaps.clickScheduleBackgroundEventWithDurationButton();

        const scheduleResult = await driver.findElement(
          '#scheduleBackgroundEventResult',
        );
        await driver.waitForNonEmptyElement(scheduleResult);

        await testSnaps.clickGetBackgroundEventResultButton();

        const eventsResult = await driver.findElement(
          '#getBackgroundEventsResult',
        );
        await driver.waitForNonEmptyElement(eventsResult);

        await testSnaps.checkGetBackgroundEventResultIncludes('fireDialog');

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
        dappOptions: {
          customDappPaths: [DAPP_PATH.TEST_SNAPS],
        },
        fixtures: new FixtureBuilder().build(),
        title: this.test?.fullTitle(),
        testSpecificMock: mockBackgroundEventsSnap,
      },
      async ({ driver }: { driver: Driver }) => {
        await loginWithoutBalanceValidation(driver);

        const testSnaps = new TestSnaps(driver);

        await openTestSnapClickButtonAndInstall(
          driver,
          'clickConnectBackgroundEventsButton',
        );
        await testSnaps.checkConnectBackgroundEventsButtonText(
          'Reconnect to Background Events Snap',
        );

        const futureDate = new Date(Date.now() + 5000).toISOString();

        await testSnaps.fillBackgroundEventDateInput(futureDate);

        await testSnaps.clickScheduleBackgroundEventWithDateButton();

        const scheduleResult = await driver.findElement(
          '#scheduleBackgroundEventResult',
        );
        await driver.waitForNonEmptyElement(scheduleResult);

        await testSnaps.clickGetBackgroundEventResultButton();

        const eventsResult = await driver.findElement(
          '#getBackgroundEventsResult',
        );
        await driver.waitForNonEmptyElement(eventsResult);

        await testSnaps.checkGetBackgroundEventResultIncludes('fireDialog');

        const eventIdText = JSON.parse(await scheduleResult.getText());
        await testSnaps.fillCancelBackgroundEventInput(eventIdText);

        await testSnaps.clickCancelBackgroundEventButton();

        // We don't have a visible event to wait for here, so we just wait a couple seconds.
        await driver.delay(2000);

        await testSnaps.clickGetBackgroundEventResultButton();

        await testSnaps.checkGetBackgroundEventResult('[]');
      },
    );
  });
});
