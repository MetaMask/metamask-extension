import { TestSnaps } from '../page-objects/pages/test-snaps';
import { Driver } from '../webdriver/driver';
import { loginWithoutBalanceValidation } from '../page-objects/flows/login.flow';
import FixtureBuilder from '../fixture-builder';
import { withFixtures } from '../helpers';
import { openTestSnapClickButtonAndInstall } from '../page-objects/flows/install-test-snap.flow';
import { mockGetFileSnap } from '../mock-response-data/snaps/snap-binary-mocks';

const jsonTextValidation = '"foo": "bar"';
const base64TextFile = '"ewogICJmb28iOiAiYmFyIgp9Cg=="';
const hexEncodedFileValidation = '"0x7b0a202022666f6f223a2022626172220a7d0a"';

describe('Test Snap Get File', function () {
  it('test snap_getFile functionality', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        testSpecificMock: mockGetFileSnap,
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await loginWithoutBalanceValidation(driver);

        const testSnaps = new TestSnaps(driver);

        // Navigate to test snaps page, connect to get-file snap, complete installation and validate
        await openTestSnapClickButtonAndInstall(driver, 'connectGetFileButton');
        await testSnaps.checkInstallationComplete(
          'connectGetFileButton',
          'Reconnect to Get File Snap',
        );

        // click on get file and check correct result
        await testSnaps.scrollAndClickButton('sendGetFileTextButton');
        await testSnaps.checkMessageResultSpan(
          'fileResultSpan',
          jsonTextValidation,
        );

        // click on get base64 and await correct result
        await testSnaps.scrollAndClickButton('sendGetFileBase64Button');
        await testSnaps.checkMessageResultSpan(
          'fileResultSpan',
          base64TextFile,
        );

        // click on get hex text and await correct result
        await testSnaps.scrollAndClickButton('sendGetFileHexButton');
        await testSnaps.checkMessageResultSpan(
          'fileResultSpan',
          hexEncodedFileValidation,
        );
      },
    );
  });
});
