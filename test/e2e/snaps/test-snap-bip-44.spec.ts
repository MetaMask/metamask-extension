import { TestSnaps } from '../page-objects/pages/test-snaps';
import { Driver } from '../webdriver/driver';
import { loginWithBalanceValidation } from '../page-objects/flows/login.flow';
import FixtureBuilder from '../fixture-builder';
import { withFixtures } from '../helpers';
import { switchAndApproveDialogSwitchToTestSnap } from '../page-objects/flows/snap-permission.flow';
import { openTestSnapClickButtonAndInstall } from '../page-objects/flows/install-test-snap.flow';
import { mockBip44Snap } from '../mock-response-data/snaps/snap-binary-mocks';

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
        testSpecificMock: mockBip44Snap,
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        // We explicitly choose to await balances to prevent flakiness due to long login times.
        await loginWithBalanceValidation(driver);

        const testSnaps = new TestSnaps(driver);

        // Navigate to `test-snaps` page, and install the Snap.
        await openTestSnapClickButtonAndInstall(driver, 'connectBip44Button', {
          withWarning: true,
        });

        // check the installation status
        await testSnaps.check_installationComplete(
          'connectBip44Button',
          'Reconnect to BIP-44 Snap',
        );

        // Click bip44 button to get private key and validate the result
        await testSnaps.scrollAndClickButton('publicKeyBip44Button');
        await testSnaps.check_messageResultSpan(
          'bip44ResultSpan',
          publicKeyBip44,
        );

        // Enter message, click sign button, approve and validate the result
        await testSnaps.fillMessage('messageBip44Input', '1234');
        await testSnaps.clickButton('signBip44MessageButton');
        await switchAndApproveDialogSwitchToTestSnap(driver);
        await testSnaps.check_messageResultSpan(
          'bip44SignResultSpan',
          publicKeyBip44Sign,
        );

        // Select entropy source SRP 1, enter a message, sign, approve and validate the result
        await testSnaps.scrollAndSelectEntropySource(
          'bip44EntropyDropDown',
          'SRP 1 (primary)',
        );
        await testSnaps.fillMessage('messageBip44Input', 'foo bar');
        await testSnaps.clickButton('signBip44MessageButton');
        await switchAndApproveDialogSwitchToTestSnap(driver);
        await testSnaps.check_messageResultSpan(
          'bip44SignResultSpan',
          publicKeyGeneratedWithEntropySourceSRP1,
        );

        // Select entropy source SRP 2, enter a message, sign, approve and validate the result
        await testSnaps.scrollAndSelectEntropySource(
          'bip44EntropyDropDown',
          'SRP 2',
        );
        await testSnaps.fillMessage('messageBip44Input', 'foo bar');
        await testSnaps.clickButton('signBip44MessageButton');
        await switchAndApproveDialogSwitchToTestSnap(driver);
        await testSnaps.check_messageResultSpan(
          'bip44SignResultSpan',
          publicKeyGeneratedWithEntropySourceSRP2,
        );

        // Select an invalid (non-existent) entropy source, enter a message, sign, approve and validate the result
        await testSnaps.scrollAndSelectEntropySource(
          'bip44EntropyDropDown',
          'Invalid',
        );
        await testSnaps.fillMessage('messageBip44Input', 'foo bar');
        await testSnaps.clickButton('signBip44MessageButton');
        await driver.waitForAlert(
          'Entropy source with ID "invalid" not found.',
        );
        await driver.closeAlertPopup();
      },
    );
  });
});
