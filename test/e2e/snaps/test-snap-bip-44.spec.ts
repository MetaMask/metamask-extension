import { TestSnaps } from '../page-objects/pages/test-snaps';
import { Driver } from '../webdriver/driver';
import { loginWithoutBalanceValidation } from '../page-objects/flows/login.flow';
import FixtureBuilder from '../fixture-builder';
import { withFixtures, WINDOW_TITLES } from '../helpers';

describe('Test Snap bip-44', function () {
  it('can pop up bip-44 snap and get private key result', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().withKeyringControllerMultiSRP().build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await loginWithoutBalanceValidation(driver);

        const testSnaps = new TestSnaps(driver);

        // Navigate to `test-snaps` page, and install the Snap.
        await testSnaps.openPage();
        await testSnaps.installSnap('#connectbip44', true);

        // find and click bip44 test
        await testSnaps.clickPublicKeyBip44Button();

        // check the results of the public key test using waitForSelector
        await driver.waitForSelector({
          css: '#bip44Result',
          text: '"0x86debb44fb3a984d93f326131d4c1db0bc39644f1a67b673b3ab45941a1cea6a385981755185ac4594b6521e4d1e08d1"',
        });

        // enter a message to sign
        await testSnaps.fillBip44MessageAndSign('1234');

        // Switch to approve signature message window
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

        // wait for and click approve and wait for window to close
        await testSnaps.snapInstall.clickApproveButton();

        // switch back to test-snaps page
        await driver.switchToWindowWithTitle(WINDOW_TITLES.TestSnaps);

        // check the results of the message signature using waitForSelector
        await driver.waitForSelector({
          css: '#bip44SignResult',
          text: '"0xa41ab87ca50606eefd47525ad90294bbe44c883f6bc53655f1b8a55aa8e1e35df216f31be62e52c7a1faa519420e20810162e07dedb0fde2a4d997ff7180a78232ecd8ce2d6f4ba42ccacad33c5e9e54a8c4d41506bdffb2bb4c368581d8b086"',
        });

        // Select a different entropy source.
        await testSnaps.selectEntropySource('bip44', 'SRP 1 (primary)');

        // Change the message and sign.
        await testSnaps.fillBip44MessageAndSign('foo bar');

        // Hit 'approve' on the signature confirmation and wait for window to
        // close, then switch back to the `test-snaps` window.
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
        await testSnaps.snapInstall.clickApproveButton();
        await driver.switchToWindowWithTitle(WINDOW_TITLES.TestSnaps);

        // Check the results of the message signature using `waitForSelector`.
        await driver.waitForSelector({
          css: '#bip44SignResult',
          text: '"0x978f82799b8f48cb78ac56153a34d360873c976fd5ec84f7a5291382dde52d6cb478cadd94153970e58e5205c054cdda0071be0551b729d79bd417f7b0fc2b0c51071ca4771c9b2d8238d7d982bc5ec9256645287402348ca0f89202fb1e0773"',
        });

        // Select a different entropy source and sign.
        await testSnaps.selectEntropySource('bip44', 'SRP 2');
        await testSnaps.fillBip44MessageAndSign('foo bar');

        // Hit 'approve' on the signature confirmation and wait for window to
        // close, then switch back to the `test-snaps` window.
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
        await testSnaps.snapInstall.clickApproveButton();
        await driver.switchToWindowWithTitle(WINDOW_TITLES.TestSnaps);

        await driver.waitForSelector({
          css: '#bip44SignResult',
          text: '"0xa8fdc184ded6d9a1b16d2d4070470720e4a946c9899ceb5165c05f9a8c4b026e8f630d6bdb60151f9e84b3c415c4b46c11bc2571022c8391b07faedc0d8c258d532d34c33149c5fc29e17c310437dc47e8afb43b2c55bd47b1b09ea295f7dcb3"',
        });

        // Select an invalid (non-existent) entropy source, and sign.
        await driver.delay(1000);
        await testSnaps.selectEntropySource('bip44', 'Invalid');
        await driver.delay(1000);
        await testSnaps.fillBip44MessageAndSign('foo bar');

        // Check the error message and close the alert.
        await driver.waitForAlert(
          'Entropy source with ID "invalid" not found.',
        );
        await driver.closeAlertPopup();
      },
    );
  });
});
