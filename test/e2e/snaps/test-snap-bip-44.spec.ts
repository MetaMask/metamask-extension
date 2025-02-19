import { TestSnaps } from '../page-objects/pages/test-snaps';
import { Driver } from '../webdriver/driver';
import { loginWithoutBalanceValidation } from '../page-objects/flows/login.flow';
import FixtureBuilder from '../fixture-builder';
import { withFixtures, WINDOW_TITLES } from '../helpers';
import SnapInstall from '../page-objects/pages/dialog/snap-install';
import { approvePermissionAndConfirm, switchToDialogAndClickApproveButton } from '../page-objects/flows/snap-permission.flow';

const publicKeyBip44 =
  '"0x86debb44fb3a984d93f326131d4c1db0bc39644f1a67b673b3ab45941a1cea6a385981755185ac4594b6521e4d1e08d1"';
const publicKeyBip44Sign =
  '"0xa41ab87ca50606eefd47525ad90294bbe44c883f6bc53655f1b8a55aa8e1e35df216f31be62e52c7a1faa519420e20810162e07dedb0fde2a4d997ff7180a78232ecd8ce2d6f4ba42ccacad33c5e9e54a8c4d41506bdffb2bb4c368581d8b086"';

describe('Test Snap bip-44', function () {
  it('can pop up bip-44 snap and get private key result', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await loginWithoutBalanceValidation(driver);

        const testSnaps = new TestSnaps(driver);
        const snapInstall = new SnapInstall(driver);

        // Navigate to test snaps page, click bip44, connect and approve
        await testSnaps.openPage();
        await testSnaps.clickConnectBip44Button();
        await approvePermissionAndConfirm(driver);

        // switch back to test snaps window and check the installation status
        await driver.switchToWindowWithTitle(WINDOW_TITLES.TestSnaps);
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
        await switchToDialogAndClickApproveButton(driver);
        await driver.switchToWindowWithTitle(WINDOW_TITLES.TestSnaps);
        await testSnaps.check_messageResultSpan(
          this.bip44SignResultSpan,
          publicKeyBip44Sign,
        );
      },
    );
  });
});
