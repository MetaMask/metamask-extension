import { TestSnaps } from '../page-objects/pages/test-snaps';
import { Driver } from '../webdriver/driver';
import { loginWithoutBalanceValidation } from '../page-objects/flows/login.flow';
import FixtureBuilder from '../fixture-builder';
import { withFixtures } from '../helpers';
import {
  confirmPermissionSwitchToTestSnap,
  switchAndApproveDialogSwitchToTestSnap,
} from '../page-objects/flows/snap-permission.flow';

const publicKeyBip44 =
  '"0x86debb44fb3a984d93f326131d4c1db0bc39644f1a67b673b3ab45941a1cea6a385981755185ac4594b6521e4d1e08d1"';
const publicKeyBip44Sign =
  '"0xa41ab87ca50606eefd47525ad90294bbe44c883f6bc53655f1b8a55aa8e1e35df216f31be62e52c7a1faa519420e20810162e07dedb0fde2a4d997ff7180a78232ecd8ce2d6f4ba42ccacad33c5e9e54a8c4d41506bdffb2bb4c368581d8b086"';
const publicKeyGeneratedWithEntropySourceSRP1 =
  '"0x978f82799b8f48cb78ac56153a34d360873c976fd5ec84f7a5291382dde52d6cb478cadd94153970e58e5205c054cdda0071be0551b729d79bd417f7b0fc2b0c51071ca4771c9b2d8238d7d982bc5ec9256645287402348ca0f89202fb1e0773"';
const publicKeyGeneratedWithEntropySourceSRP2 =
  '"0xa8fdc184ded6d9a1b16d2d4070470720e4a946c9899ceb5165c05f9a8c4b026e8f630d6bdb60151f9e84b3c415c4b46c11bc2571022c8391b07faedc0d8c258d532d34c33149c5fc29e17c310437dc47e8afb43b2c55bd47b1b09ea295f7dcb3"';

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
        await testSnaps.clickConnectBip44Button();
        await confirmPermissionSwitchToTestSnap(driver, true);

        // check the installation status
        await testSnaps.check_installationComplete(
          this.reconnectBip44Button,
          'Reconnect to BIP-44 Snap',
        );

        // Click bip44 button to get private key and validate the result
        await testSnaps.clickPublicKeyBip44Button();
        await testSnaps.check_messageResultSpan(
          testSnaps.bip44ResultSpan,
          publicKeyBip44,
        );

        // Enter message, click sign button, approve and validate the result
        await testSnaps.fillBip44MessageAndSign('1234');
        await switchAndApproveDialogSwitchToTestSnap(driver);
        await testSnaps.check_messageResultSpan(
          this.bip44SignResultSpan,
          publicKeyBip44Sign,
        );

        // Select entropy source SRP 1, enter a message, sign, approve and validate the result
        await testSnaps.scrollAndSelectEntropySource(
          'bip44',
          'SRP 1 (primary)',
        );
        await testSnaps.fillBip44MessageAndSign('foo bar');
        await switchAndApproveDialogSwitchToTestSnap(driver);
        await testSnaps.check_messageResultSpan(
          this.bip44SignResultSpan,
          publicKeyGeneratedWithEntropySourceSRP1,
        );

        // Select entropy source SRP 2, enter a message, sign, approve and validate the result
        await testSnaps.scrollAndSelectEntropySource('bip44', 'SRP 2');
        await testSnaps.fillBip44MessageAndSign('foo bar');
        await switchAndApproveDialogSwitchToTestSnap(driver);
        await testSnaps.check_messageResultSpan(
          this.bip44SignResultSpan,
          publicKeyGeneratedWithEntropySourceSRP2,
        );

        // Select an invalid (non-existent) entropy source, enter a message, sign, approve and validate the result
        await testSnaps.scrollAndSelectEntropySource('bip44', 'Invalid');
        await testSnaps.fillBip44MessageAndSign('foo bar');
        await driver.waitForAlert(
          'Entropy source with ID "invalid" not found.',
        );
        await driver.closeAlertPopup();
      },
    );
  });
});
