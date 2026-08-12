import { mockBackgroundEventsSnap } from '../mock-response-data/snaps/snap-binary-mocks';
import { openTestSnapClickButtonAndInstall } from '../page-objects/flows/install-test-snap.flow';
import { login } from '../page-objects/flows/login.flow';
import SnapInstall from '../page-objects/pages/dialog/snap-install';
import { TestSnaps } from '../page-objects/pages/test-snaps';
import { Driver } from '../webdriver/driver';
import { DAPP_PATH, WINDOW_TITLES } from '../constants';
import { withFixtures } from '../helpers';
import FixtureBuilderV2 from '../fixtures/fixture-builder-v2';

describe('Test Snap Background Events', function () {
  it('can trigger a background event with a date to open a dialog', async function () {
    await withFixtures(
      {
        dappOptions: {
          customDappPaths: [DAPP_PATH.TEST_SNAPS],
        },
        fixtures: new FixtureBuilderV2()
          .withSnapsPrivacyWarningAlreadyShown()
          .build(),
        title: this.test?.fullTitle(),
        testSpecificMock: mockBackgroundEventsSnap,
      },
      async ({ driver }: { driver: Driver }) => {
        await login(driver);

        const testSnaps = new TestSnaps(driver);
        const snapInstall = new SnapInstall(driver);

        // Navigate to test snaps page, connect to background events Snap, complete installation and validate
        await openTestSnapClickButtonAndInstall(
          driver,
          'connectBackgroundEventsButton',
        );
        await testSnaps.checkInstallationComplete(
          'connectBackgroundEventsButton',
          'Reconnect to Background Events Snap',
        );

        // ISO 8601 date string
        const futureDate = new Date(Date.now() + 5000).toISOString();

        await testSnaps.fillMessage('backgroundEventDateInput', futureDate);

        await testSnaps.clickButton('scheduleBackgroundEventWithDateButton');

        await testSnaps.waitForNonEmptyResult('backgroundEventResultSpan');

        await testSnaps.clickButton('getBackgroundEventResultButton');

        await testSnaps.checkMessageResultSpanIncludes(
          'getBackgroundEventResultSpan',
          'fireDialog',
        );

        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

        // look for the dialog popup to verify background event fired
        await testSnaps.checkMessageResultSpan(
          'snapUIRenderer',
          'This dialog was triggered by a background event',
        );

        // try to click on the Close button and pass test if window closes
        await snapInstall.clickCloseButton();
      },
    );
  });

  it('can trigger a background event with a duration to open a dialog', async function () {
    await withFixtures(
      {
        dappOptions: {
          customDappPaths: [DAPP_PATH.TEST_SNAPS],
        },
        fixtures: new FixtureBuilderV2()
          .withSnapsPrivacyWarningAlreadyShown()
          .build(),
        title: this.test?.fullTitle(),
        testSpecificMock: mockBackgroundEventsSnap,
      },
      async ({ driver }: { driver: Driver }) => {
        await login(driver);

        const testSnaps = new TestSnaps(driver);
        const snapInstall = new SnapInstall(driver);

        // Navigate to test snaps page, connect to background events Snap, complete installation and validate
        await openTestSnapClickButtonAndInstall(
          driver,
          'connectBackgroundEventsButton',
        );

        await testSnaps.checkInstallationComplete(
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

        await testSnaps.waitForNonEmptyResult('backgroundEventResultSpan');

        await testSnaps.clickButton('getBackgroundEventResultButton');

        await testSnaps.checkMessageResultSpanIncludes(
          'getBackgroundEventResultSpan',
          'fireDialog',
        );

        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

        // look for the dialog popup to verify background event fired
        await testSnaps.checkMessageResultSpan(
          'snapUIRenderer',
          'This dialog was triggered by a background event',
        );

        // try to click on the Close button and pass test if window closes
        await snapInstall.clickCloseButton();
      },
    );
  });

  it('can cancel a background event', async function () {
    await withFixtures(
      {
        dappOptions: {
          customDappPaths: [DAPP_PATH.TEST_SNAPS],
        },
        fixtures: new FixtureBuilderV2()
          .withSnapsPrivacyWarningAlreadyShown()
          .build(),
        title: this.test?.fullTitle(),
        testSpecificMock: mockBackgroundEventsSnap,
      },
      async ({ driver }: { driver: Driver }) => {
        await login(driver);

        const testSnaps = new TestSnaps(driver);

        await openTestSnapClickButtonAndInstall(
          driver,
          'connectBackgroundEventsButton',
        );
        await testSnaps.checkInstallationComplete(
          'connectBackgroundEventsButton',
          'Reconnect to Background Events Snap',
        );

        const futureDate = new Date(Date.now() + 5000).toISOString();

        await testSnaps.fillMessage('backgroundEventDateInput', futureDate);

        await testSnaps.clickButton('scheduleBackgroundEventWithDateButton');

        const scheduleResult = await testSnaps.waitForNonEmptyResult(
          'backgroundEventResultSpan',
        );

        await testSnaps.clickButton('getBackgroundEventResultButton');

        await testSnaps.checkMessageResultSpanIncludes(
          'getBackgroundEventResultSpan',
          'fireDialog',
        );

        const eventIdText = JSON.parse(scheduleResult);
        await testSnaps.fillMessage('cancelBackgroundEventInput', eventIdText);

        await testSnaps.clickButton('cancelBackgroundEventButton');

        // We don't have a visible event to wait for here, so we just wait a couple seconds.
        await driver.delay(2000);

        await testSnaps.clickButton('getBackgroundEventResultButton');

        await testSnaps.checkMessageResultSpan(
          'getBackgroundEventResultSpan',
          '[]',
        );
      },
    );
  });
});
