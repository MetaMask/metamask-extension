import { TestSnaps } from '../page-objects/pages/test-snaps';
import { Driver } from '../webdriver/driver';
import { loginWithoutBalanceValidation } from '../page-objects/flows/login.flow';
import FixtureBuilder from '../fixture-builder';
import { withFixtures, WINDOW_TITLES } from '../helpers';
import SnapInstall from '../page-objects/pages/dialog/snap-install';
import SnapInstallWarning from '../page-objects/pages/dialog/snap-install-warning';

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
        const snapInstall = new SnapInstall(driver);
        const snapInstallWarning = new SnapInstallWarning(driver);

        // navigate to test snaps page and connect wait for page to load
        await testSnaps.openPage();

        // find, scroll and click connect to the bip32 snap
        await testSnaps.clickConnectBip32();

        // switch to metamask extension and click connect
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
        await snapInstall.check_pageIsLoaded();
        await snapInstall.clickNextButton();

        // click confirm
        await snapInstall.clickConfirmButton();

        // wait for permissions popover, click checkboxes and confirm
        await snapInstallWarning.check_pageIsLoaded();
        await snapInstallWarning.clickCheckboxPermission();
        await snapInstallWarning.clickConfirmButton();

        // wait for and click OK and wait for window to close
        await snapInstall.clickNextButton();

        // switch back to test-snaps window
        await driver.switchToWindowWithTitle(WINDOW_TITLES.TestSnaps);

        // wait for npm installation success
        await testSnaps.waitForReconnectButton();

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
        await snapInstall.clickApproveButton();

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

        await snapInstall.clickApproveButton();

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

        await snapInstall.clickApproveButton();

        // switch back to test-snaps window
        await driver.switchToWindowWithTitle(WINDOW_TITLES.TestSnaps);

        // check results of ed25519 signature with waitForSelector
        await driver.waitForSelector({
          css: '#bip32MessageResult-ed25519Bip32',
          text: '"0xc279ee3e49f7e392a4e511136c39791e076f9be01d8648f3f1586ecf0f41def1739fa2978f90cfb2da4cf53ccb99405558cffcc4d190199b6949b03b1b8dae05"',
        });
      },
    );
  });
});
