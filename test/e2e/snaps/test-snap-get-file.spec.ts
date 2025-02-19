import { TestSnaps } from '../page-objects/pages/test-snaps';
import { Driver } from '../webdriver/driver';
import { loginWithoutBalanceValidation } from '../page-objects/flows/login.flow';
import FixtureBuilder from '../fixture-builder';
import { withFixtures, WINDOW_TITLES } from '../helpers';
import { completeSnapInstallConfirmation } from '../page-objects/flows/snap-permission.flow';

const jsonTextValidation = '"foo": "bar"';
const base64TextFile = '"ewogICJmb28iOiAiYmFyIgp9Cg=="';
const hexEncodedFileValidation = '"0x7b0a202022666f6f223a2022626172220a7d0a"';

describe('Test Snap Get File', function () {
  it('test snap_getFile functionality', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await loginWithoutBalanceValidation(driver);

        const testSnaps = new TestSnaps(driver);

        // Navigate to test snaps page and connect to get-file snap
        await testSnaps.openPage();
        await testSnaps.connectGetFileButton();
        await completeSnapInstallConfirmation(driver);

        // Switch back to test snaps window and check the installation status
        await driver.switchToWindowWithTitle(WINDOW_TITLES.TestSnaps);
        await testSnaps.check_installationComplete(
          testSnaps.connectGetFile,
          'Reconnect to Get File Snap',
        );

        // click on get file and check correct result
        await testSnaps.clickGetFileTextButton();
        await testSnaps.check_messageResultSpan(
          testSnaps.fileResultSpan,
          jsonTextValidation,
        );

        // click on get base64 and await correct result
        await testSnaps.clickGetFileBase64Button();
        await testSnaps.check_messageResultSpan(
          testSnaps.fileResultSpan,
          base64TextFile,
        );

        // click on get hex text and await correct result
        await testSnaps.clickGetFileTextHexButton();
        await testSnaps.check_messageResultSpan(
          testSnaps.fileResultSpan,
          hexEncodedFileValidation,
        );
      },
    );
  });
});
