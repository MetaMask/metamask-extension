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
          text: '"0x043e98d696ae15caef75fa8dd204a7c5c08d1272b2218ba3c20feeb4c691eec366606ece56791c361a2320e7fad8bcbb130f66d51c591fc39767ab2856e93f8dfb',
        });

        // scroll to and click get compressed public key
        await testSnaps.clickGetCompressedPublicKeyButton();

        // check for proper public key response using waitForSelector
        await driver.waitForSelector({
          css: '#bip32PublicKeyResult',
          text: '"0x033e98d696ae15caef75fa8dd204a7c5c08d1272b2218ba3c20feeb4c691eec366',
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
          text: '"0x3045022100b3ade2992ea3e5eb58c7550e9bddad356e9554233c8b099ebc3cb418e9301ae2022064746e15ae024808f0ba5d860e44dc4c97e65c8cba6f5ef9ea2e8c819930d2dc',
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
          text: '"0xf3215b4d6c59aac7e01b4ceef530d1e2abf4857926b85a81aaae3894505699243768a887b7da4a8c2e0f25196196ba290b6531050db8dc15c252bdd508532a0a"',
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
          text: '"0xc279ee3e49f7e392a4e511136c39791e076f9be01d8648f3f1586ecf0f41def1739fa2978f90cfb2da4cf53ccb99405558cffcc4d190199b6949b03b1b8dae05"',
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
          text: '"0x3045022100bd7301b5288fcc15e9c19bf548b666356230343a57f4ef0327a8e81f19ac562c022062698ed00a36e9ddd1563e1dc2e357d747bdfb233192ee1597cabb6c7210a6ba"',
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
