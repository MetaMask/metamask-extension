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
          text: '"0xa40ed930feb776ceefaffa83eebc544302a74143376413bbbfa7a241c1edcd71cc870bbfb7dc1ca6c121f5ec1f659dc6"',
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
          text: '"0x8663842acfa967d82615ed421d0fed7e371591b9224917240288705078c2fe4831fb92d7967b4392e5566ca6ae1ec07517186c784501c2312a485c6f4216e0ae36e439337e4535352f8f30292aeed56507f3e5e450795fdb119c0d28d9bc1144"',
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
          text: '"0xaad1b09202c4d48e7730dece56ef547fa1a19fcda345bf600704f14bb848cf4e7bb72b73e2a2d564de6ea75b3ab0ce3116a3fddd2122102a7dc79cebf0235338044a4020407e25f60232b8a04f59785c3db26bfb076862284df46fed8afce9e5"',
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
