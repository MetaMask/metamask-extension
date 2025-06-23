import { TestSnaps } from '../page-objects/pages/test-snaps';
import { Driver } from '../webdriver/driver';
import { loginWithBalanceValidation } from '../page-objects/flows/login.flow';
import FixtureBuilder from '../fixture-builder';
import { withFixtures } from '../helpers';
import { switchAndApproveDialogSwitchToTestSnap } from '../page-objects/flows/snap-permission.flow';
import { openTestSnapClickButtonAndInstall } from '../page-objects/flows/install-test-snap.flow';
import { mockBip32Snap } from '../mock-response-data/snaps/snap-binary-mocks';

const bip32PublicKey =
  '"0x043e98d696ae15caef75fa8dd204a7c5c08d1272b2218ba3c20feeb4c691eec366606ece56791c361a2320e7fad8bcbb130f66d51c591fc39767ab2856e93f8dfb"';
const bip32CompressedPublicKey =
  '"0x033e98d696ae15caef75fa8dd204a7c5c08d1272b2218ba3c20feeb4c691eec366"';
const publicKeyGeneratedWithSecp256k1Message =
  '"0x3045022100b3ade2992ea3e5eb58c7550e9bddad356e9554233c8b099ebc3cb418e9301ae2022064746e15ae024808f0ba5d860e44dc4c97e65c8cba6f5ef9ea2e8c819930d2dc"';
const publicKeyGeneratedWithEd2551 =
  '"0xf3215b4d6c59aac7e01b4ceef530d1e2abf4857926b85a81aaae3894505699243768a887b7da4a8c2e0f25196196ba290b6531050db8dc15c252bdd508532a0a"';
const publicKeyGeneratedWithEd25519Bip32 =
  '"0xc279ee3e49f7e392a4e511136c39791e076f9be01d8648f3f1586ecf0f41def1739fa2978f90cfb2da4cf53ccb99405558cffcc4d190199b6949b03b1b8dae05"';
const publicKeyGeneratedWithEntropySourceSRP1 =
  '"0x3045022100bd7301b5288fcc15e9c19bf548b666356230343a57f4ef0327a8e81f19ac562c022062698ed00a36e9ddd1563e1dc2e357d747bdfb233192ee1597cabb6c7210a6ba"';
const publicKeyGeneratedWithEntropySourceSRP2 =
  '"0x3045022100ad81b36b28f5f5dd47f45a46b2e7cf42e501d2e9b5768627b0702c100f80eb3c02200a481cbbe22b47b4ea6cd923a7da22952f5b21a0dc52e841dcd08f7af8c74e05"';

describe('Test Snap bip-32', function () {
  it('tests various functions of bip-32', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().withKeyringControllerMultiSRP().build(),
        testSpecificMock: mockBip32Snap,
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        // We explicitly choose to await balances to prevent flakiness due to long login times.
        await loginWithBalanceValidation(driver);

        const testSnaps = new TestSnaps(driver);

        // Navigate to `test-snaps` page, click bip32, connect and approve
        await openTestSnapClickButtonAndInstall(driver, 'connectBip32Button', {
          withWarning: true,
        });

        // check the installation status
        await testSnaps.check_installationComplete(
          'connectBip32Button',
          'Reconnect to BIP-32 Snap',
        );

        // Click bip32 button to get private key and validate the result
        await testSnaps.scrollAndClickButton('getBip32PublicKeyButton');
        await testSnaps.check_messageResultSpan(
          'bip32PublicKeyResultSpan',
          bip32PublicKey,
        );

        // Click get compressed public key and validate the result
        await testSnaps.scrollAndClickButton(
          'getBip32CompressedPublicKeyButton',
        );
        await testSnaps.check_messageResultSpan(
          'bip32PublicKeyResultSpan',
          bip32CompressedPublicKey,
        );

        // Enter secp256k1 signature message, click sign button, approve and validate the result
        await testSnaps.fillMessage('messageSecp256k1Input', 'foo bar');
        await testSnaps.clickButton('signBip32messageSecp256k1Button');
        await switchAndApproveDialogSwitchToTestSnap(driver);
        await testSnaps.check_messageResultSpan(
          'bip32MessageResultSecp256k1Span',
          publicKeyGeneratedWithSecp256k1Message,
        );

        // Enter ed25519 signature message, click sign button, approve and validate the result
        await testSnaps.scrollToButton('signEd25519MessageButton');
        await testSnaps.fillMessage('messageEd25519Input', 'foo bar');
        await testSnaps.clickButton('signEd25519MessageButton');
        await switchAndApproveDialogSwitchToTestSnap(driver);
        await testSnaps.check_messageResultSpan(
          'bip32MessageResultEd25519Span',
          publicKeyGeneratedWithEd2551,
        );

        // Enter ed25519 signature message, click sign button, approve and validate the result
        await testSnaps.fillMessage('messageEd25519Bip32Input', 'foo bar');
        await testSnaps.scrollAndClickButton('signEd25519Bip32MessageButton');
        await switchAndApproveDialogSwitchToTestSnap(driver);
        await testSnaps.check_messageResultSpan(
          'messageResultEd25519SBip32Span',
          publicKeyGeneratedWithEd25519Bip32,
        );

        // Select entropy source SRP 1, enter a message, sign, approve and validate the result
        await testSnaps.scrollAndSelectEntropySource(
          'bip32EntropyDropDown',
          'SRP 1 (primary)',
        );

        await testSnaps.fillMessage('messageSecp256k1Input', 'bar baz');
        await testSnaps.clickButton('signBip32messageSecp256k1Button');
        await switchAndApproveDialogSwitchToTestSnap(driver);
        await testSnaps.check_messageResultSpan(
          'bip32MessageResultSecp256k1Span',
          publicKeyGeneratedWithEntropySourceSRP1,
        );

        // Select entropy source SRP 2, enter a message, sign, approve and validate the result
        await testSnaps.scrollAndSelectEntropySource(
          'bip32EntropyDropDown',
          'SRP 2',
        );
        await testSnaps.fillMessage('messageSecp256k1Input', 'bar baz');
        await testSnaps.clickButton('signBip32messageSecp256k1Button');
        await switchAndApproveDialogSwitchToTestSnap(driver);
        await testSnaps.check_messageResultSpan(
          'bip32MessageResultSecp256k1Span',
          publicKeyGeneratedWithEntropySourceSRP2,
        );

        // Select an invalid (non-existent) entropy source, enter a message, sign, approve and validate the result
        await testSnaps.scrollAndSelectEntropySource(
          'bip32EntropyDropDown',
          'Invalid',
        );
        await testSnaps.fillMessage('messageSecp256k1Input', 'bar baz');
        await testSnaps.clickButton('signBip32messageSecp256k1Button');

        // Check the error message and close the alert.
        await driver.waitForAlert(
          'Entropy source with ID "invalid" not found.',
        );
        await driver.closeAlertPopup();
      },
    );
  });
});
