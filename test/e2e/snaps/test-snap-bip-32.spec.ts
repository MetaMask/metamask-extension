import { TestSnaps } from '../page-objects/pages/test-snaps';
import { Driver } from '../webdriver/driver';
import { loginWithoutBalanceValidation } from '../page-objects/flows/login.flow';
import FixtureBuilder from '../fixture-builder';
import { withFixtures, WINDOW_TITLES } from '../helpers';
import {
  approvePermissionAndConfirm,
  switchToDialogAndClickApproveButton,
} from '../page-objects/flows/snap-permission.flow';

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

describe('Test Snap bip-32', function () {
  it('tests various functions of bip-32', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await loginWithoutBalanceValidation(driver);

        const testSnaps = new TestSnaps(driver);

        // Navigate to test snaps page, click bip32, connect and approve
        await testSnaps.openPage();
        await testSnaps.clickConnectBip32Button();
        await approvePermissionAndConfirm(driver);

        // Switch back to test snaps window and check the installation status
        await driver.switchToWindowWithTitle(WINDOW_TITLES.TestSnaps);
        await testSnaps.check_installationComplete(
          testSnaps.reconnectBip32Button,
          'Reconnect to BIP-32 Snap',
        );

        // Click bip32 button to get private key and validate the result
        await testSnaps.clickGetPublicKeyBip32Button();
        await testSnaps.check_messageResultSpan(
          testSnaps.bip32PublicKeyResultSpan,
          bip32PublicKey,
        );

        // Click get compressed public key and validate the result
        await testSnaps.clickGetCompressedPublicKeyBip32Button();
        await testSnaps.check_messageResultSpan(
          testSnaps.bip32PublicKeyResultSpan,
          bip32CompressedPublicKey,
        );

        // Enter secp256k1 signature message, click sign button, approve and validate the result
        await testSnaps.fillMessageAndSignSecp256k1('foo bar');
        await switchToDialogAndClickApproveButton(driver);
        await driver.switchToWindowWithTitle(WINDOW_TITLES.TestSnaps);
        await testSnaps.check_messageResultSpan(
          testSnaps.bip32MessageResultSecp256k1Span,
          publicKeyGeneratedWithSecp256k1Message,
        );

        // Enter ed25519 signature message, click sign button, approve and validate the result
        await testSnaps.scrollToSendEd25519();
        await testSnaps.fillMessageAndSignEd25519('foo bar');
        await switchToDialogAndClickApproveButton(driver);
        await driver.switchToWindowWithTitle(WINDOW_TITLES.TestSnaps);
        await testSnaps.check_messageResultSpan(
          testSnaps.bip32MessageResultEd25519Span,
          publicKeyGeneratedWithEd2551,
        );

        // Enter ed25519 signature message, click sign button, approve and validate the result
        await testSnaps.fillMessageAndSignEd25519Bip32('foo bar');
        await switchToDialogAndClickApproveButton(driver);
        await driver.switchToWindowWithTitle(WINDOW_TITLES.TestSnaps);
        await testSnaps.check_messageResultSpan(
          testSnaps.messageResultEd25519SBip32Span,
          publicKeyGeneratedWithEd25519Bip32,
        );
      },
    );
  });
});
