import { Driver } from '../webdriver/driver';
import { TestSnaps } from '../page-objects/pages/test-snaps';
import SnapInstall from '../page-objects/pages/dialog/snap-install';
import FixtureBuilderV2 from '../fixtures/fixture-builder-v2';
import { loginWithBalanceValidation } from '../page-objects/flows/login.flow';
import { openTestSnapClickButtonAndInstall } from '../page-objects/flows/install-test-snap.flow';
import { withFixtures } from '../helpers';
import { mockDialogSnap } from '../mock-response-data/snaps/snap-binary-mocks';
import { DAPP_PATH, DAPP_URL_LOCALHOST, WINDOW_TITLES } from '../constants';

describe('Test Snap Dialog', function () {
  it('test all four snap_dialog types', async function () {
    await withFixtures(
      {
        dappOptions: {
          customDappPaths: [DAPP_PATH.TEST_SNAPS],
        },
        fixtures: new FixtureBuilderV2()
          .withSnapsPrivacyWarningAlreadyShown()
          .build(),
        testSpecificMock: mockDialogSnap,
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await loginWithBalanceValidation(driver);

        const testSnaps = new TestSnaps(driver);
        const snapInstall = new SnapInstall(driver);

        await openTestSnapClickButtonAndInstall(
          driver,
          'connectDialogsButton',
          {
            url: DAPP_URL_LOCALHOST,
          },
        );
        await testSnaps.checkInstallationComplete(
          'connectDialogsButton',
          'Reconnect to Dialogs Snap',
        );

        // Test 1 - alert dialog
        await testSnaps.clickButton('sendAlertButton');
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
        await snapInstall.waitForDialogPanelText(
          'It has a single button: "OK"',
        );
        await snapInstall.clickDialogButtonAndWaitForClose({
          text: 'OK',
          tag: 'button',
        });
        await driver.switchToWindowWithTitle(WINDOW_TITLES.TestSnaps);
        await testSnaps.checkMessageResultSpan('dialogResultSpan', 'null');

        // Test 2 - confirmation dialog (reject)
        await testSnaps.clickButton('confirmationButton');
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
        await snapInstall.clickDialogButtonAndWaitForClose({
          text: 'Reject',
          tag: 'button',
        });
        await driver.switchToWindowWithTitle(WINDOW_TITLES.TestSnaps);
        await testSnaps.checkMessageResultSpan('dialogResultSpan', 'false');

        // Test 2 - confirmation dialog (approve)
        await testSnaps.clickButton('confirmationButton');
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
        await snapInstall.clickDialogButtonAndWaitForClose({
          text: 'Approve',
          tag: 'button',
        });
        await driver.switchToWindowWithTitle(WINDOW_TITLES.TestSnaps);
        await testSnaps.checkMessageResultSpan('dialogResultSpan', 'true');

        // Test 3 - prompt dialog (cancel)
        await testSnaps.clickButton('sendPromptButton');
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
        await snapInstall.clickDialogButtonAndWaitForClose({
          text: 'Cancel',
          tag: 'button',
        });
        await driver.switchToWindowWithTitle(WINDOW_TITLES.TestSnaps);
        await testSnaps.checkMessageResultSpan('dialogResultSpan', 'null');

        // Test 3 - prompt dialog (submit with value)
        await testSnaps.clickButton('sendPromptButton');
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
        await snapInstall.pasteIntoPromptInput('2323');
        await snapInstall.clickDialogButtonAndWaitForClose({
          text: 'Submit',
          tag: 'button',
        });
        await driver.switchToWindowWithTitle(WINDOW_TITLES.TestSnaps);
        await testSnaps.checkMessageResultSpan('dialogResultSpan', '"2323"');

        // Test 4 - custom dialog (cancel)
        await testSnaps.clickButton('sendCustomButton');
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
        await snapInstall.clickDialogButtonAndWaitForClose({
          text: 'Cancel',
          tag: 'span',
        });
        await driver.switchToWindowWithTitle(WINDOW_TITLES.TestSnaps);
        await testSnaps.checkMessageResultSpan('dialogResultSpan', 'null');

        // Test 4 - custom dialog (confirm with value)
        await testSnaps.clickButton('sendCustomButton');
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
        await snapInstall.pasteIntoCustomDialogInput('2323');
        await snapInstall.clickDialogButtonAndWaitForClose({
          text: 'Confirm',
          tag: 'span',
        });
        await driver.switchToWindowWithTitle(WINDOW_TITLES.TestSnaps);
        await testSnaps.checkMessageResultSpan('dialogResultSpan', '"2323"');
      },
    );
  });
});
