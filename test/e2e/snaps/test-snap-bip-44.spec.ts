import { TestSnaps } from '../page-objects/pages/test-snaps';
import { Driver } from '../webdriver/driver';
import { loginWithoutBalanceValidation } from '../page-objects/flows/login.flow';
import FixtureBuilder from '../fixture-builder';
import { withFixtures, WINDOW_TITLES } from '../helpers';
import SnapInstall from '../page-objects/pages/dialog/snap-install';
import SnapInstallWarning from '../page-objects/pages/dialog/snap-install-warning';

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
        const snapInstallWarning = new SnapInstallWarning(driver);

        // navigate to test snaps page and connect wait for page to load
        await testSnaps.openPage();

        // find and scroll to the bip44 snap
        await testSnaps.clickConnectBip44();

        // switch to metamask extension and click connect and approve
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
        await snapInstall.check_pageIsLoaded();
        await snapInstall.clickNextButton();

        // click confirm
        await snapInstall.clickConfirmButton();

        // deal with permissions popover, click checkboxes and confirm
        await snapInstallWarning.check_pageIsLoaded();
        await snapInstallWarning.clickCheckboxPermission();
        await snapInstallWarning.clickConfirmButton();

        // wait for and click ok and wait for window to close
        await snapInstall.clickNextButton();

        // switch back to test-snaps window
        await driver.switchToWindowWithTitle(WINDOW_TITLES.TestSnaps);

        // wait for npm installation success
        await testSnaps.waitForReconnectBip44Button();

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
        await snapInstall.clickApproveButton();

        // switch back to test-snaps page
        await driver.switchToWindowWithTitle(WINDOW_TITLES.TestSnaps);

        // check the results of the message signature using waitForSelector
        await driver.waitForSelector({
          css: '#bip44SignResult',
          text: '"0xa41ab87ca50606eefd47525ad90294bbe44c883f6bc53655f1b8a55aa8e1e35df216f31be62e52c7a1faa519420e20810162e07dedb0fde2a4d997ff7180a78232ecd8ce2d6f4ba42ccacad33c5e9e54a8c4d41506bdffb2bb4c368581d8b086"',
        });
      },
    );
  });
});
