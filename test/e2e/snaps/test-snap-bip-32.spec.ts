import { TestSnaps } from '../page-objects/pages/test-snaps';
import { Driver } from '../webdriver/driver';
import { loginWithoutBalanceValidation } from '../page-objects/flows/login.flow';
import FixtureBuilder from '../fixture-builder';
import { withFixtures, WINDOW_TITLES } from '../helpers';

describe('Test Snap bip-32', function () {
  it('tests various functions of bip-32', async function () {
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
        await testSnaps.installSnap('#connectbip32', true);

        // scroll to and click get public key
        await testSnaps.clickGetPublicKeyButton();

        // check for proper public key response using waitForSelector
        await driver.waitForSelector({
          css: '#bip32PublicKeyResult',
          text: '"0x0425093606ebba8e4dd7b028fc1a7d77b79ef36fa231faf00c71123bac0e3dd7b7b608c7f5e532aafbff5519dd48b4d65c6b9ef6eb799c0bf9c683250448de214e',
        });

        // scroll to and click get compressed public key
        await testSnaps.clickGetCompressedPublicKeyButton();

        // check for proper public key response using waitForSelector
        await driver.waitForSelector({
          css: '#bip32PublicKeyResult',
          text: '"0x0225093606ebba8e4dd7b028fc1a7d77b79ef36fa231faf00c71123bac0e3dd7b7',
        });

        // wait then run SECP256K1 test
        await testSnaps.fillMessageSecp256k1('foo bar');

        // hit 'approve' on the signature confirmation and wait for window to close
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
        await testSnaps.snapInstall.clickApproveButton();

        // switch back to the test-snaps window
        await driver.switchToWindowWithTitle(WINDOW_TITLES.TestSnaps);

        // check results of the secp256k1 signature with waitForSelector
        await driver.waitForSelector({
          css: '#bip32MessageResult-secp256k1',
          text: '"0x30450221008727a4e13e6abab2275e64ea2959a7c04119fbb5b32acc7479afbb103c30c363022027c08035d5dc41b4e639703fb6db3950a27b68d65c98a1300b527b0a1d137649',
        });

        // scroll further into messages section
        await testSnaps.scrollToSendEd25519();

        // wait then run ed25519 test
        await testSnaps.fillMessageEd25519('foo bar');

        // switch to dialog window
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

        await testSnaps.snapInstall.clickApproveButton();

        // switch back to test-snaps window
        await driver.switchToWindowWithTitle(WINDOW_TITLES.TestSnaps);

        // check results of ed25519 signature with waitForSelector
        await driver.waitForSelector({
          css: '#bip32MessageResult-ed25519',
          text: '"0xec5dafc0e11dd77f7aa9c30ee78c676bb4c10352da6bd1ca69686f281010e0f13068dfcb8f5e96610861fca88f3220797f95514a8134d336b18cdebc993df60d"',
        });

        // wait then run ed25519 test
        await testSnaps.fillMessageEd25519Bip32('foo bar');

        // switch to dialog window
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

        await testSnaps.snapInstall.clickApproveButton();

        // switch back to test-snaps window
        await driver.switchToWindowWithTitle(WINDOW_TITLES.TestSnaps);

        // check results of ed25519 signature with waitForSelector
        await driver.waitForSelector({
          css: '#bip32MessageResult-ed25519Bip32',
          text: '"0x299ef8f91d1f0fed398de26eb1aceae44be08fe69f461a908b9080a18bce41ef4e181620f1e2e2d3c24529a652441cdc9b6ed9a2fa6163e6cb249926712a1f06"',
        });

        // Select a different entropy source.
        await testSnaps.selectEntropySource('bip32', 'SRP 1 (primary)');

        // Change the message and sign.
        await testSnaps.fillMessageSecp256k1('bar baz');

        // Hit 'approve' on the signature confirmation and wait for window to
        // close, then switch back to the `test-snaps` window.
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
        await testSnaps.snapInstall.clickApproveButton();
        await driver.switchToWindowWithTitle(WINDOW_TITLES.TestSnaps);

        // Check the results of the message signature using `waitForSelector`.
        await driver.waitForSelector({
          css: '#bip32MessageResult-secp256k1',
          text: '"0x3044022061957f2e5aed783f014b221d8dd086746b57ba65c96987cad7d30ee32a7a7476022003d130308d5d5405eac1b7eb6131cfcfa736a9a28dc49c3b8ba4ef26fd28de6c"',
        });

        // Select a different entropy source and sign.
        await testSnaps.selectEntropySource('bip32', 'SRP 2');
        await testSnaps.fillMessageSecp256k1('bar baz');

        // Hit 'approve' on the signature confirmation and wait for window to
        // close, then switch back to the `test-snaps` window.
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
        await testSnaps.snapInstall.clickApproveButton();
        await driver.switchToWindowWithTitle(WINDOW_TITLES.TestSnaps);

        await driver.waitForSelector({
          css: '#bip32MessageResult-secp256k1',
          text: '"0x3045022100ad81b36b28f5f5dd47f45a46b2e7cf42e501d2e9b5768627b0702c100f80eb3c02200a481cbbe22b47b4ea6cd923a7da22952f5b21a0dc52e841dcd08f7af8c74e05"',
        });

        // Select an invalid (non-existent) entropy source, and sign.
        await testSnaps.selectEntropySource('bip32', 'Invalid');
        await testSnaps.fillMessageSecp256k1('bar baz');

        // Check the error message and close the alert.
        await driver.waitForAlert(
          'Entropy source with ID "invalid" not found.',
        );
        await driver.closeAlertPopup();
      },
    );
  });
});
