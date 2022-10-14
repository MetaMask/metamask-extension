const { strict: assert } = require('assert');
const { withFixtures } = require('../helpers');
const { TEST_SNAPS_WEBSITE_URL } = require('./enums');

describe('Test Snap bip-32', function () {
  it('tests various functions of bip-32', async function () {
    const ganacheOptions = {
      accounts: [
        {
          secretKey:
            '0x7C9529A67102755B7E6102D6D950AC5D5863C98713805CEC576B945B15B71EAC',
        },
      ],
    };
    await withFixtures(
      {
        fixtures: 'imported-account',
        ganacheOptions,
        title: this.test.title,
      },
      async ({ driver }) => {
        await driver.navigate();

        // enter pw into extension
        await driver.fill('#password', 'correct horse battery staple');
        await driver.press('#password', driver.Key.ENTER);

        // open a new tab and navigate to test snaps page and connect
        await driver.openNewPage(TEST_SNAPS_WEBSITE_URL);

        // find and scroll to the correct card and click first
        const snapButton = await driver.findElement('#sendUpdateHello');
        await driver.scrollToElement(snapButton);
        await driver.delay(500);
        await driver.fill('#snapId6', 'npm:@metamask/test-snap-bip32');
        await driver.clickElement('#connectBip32');

        // switch to metamask extension and click connect
        await driver.waitUntilXWindowHandles(3, 5000, 10000);
        let windowHandles = await driver.getAllWindowHandles();
        await driver.switchToWindowWithTitle(
          'MetaMask Notification',
          windowHandles,
        );
        await driver.clickElement(
          {
            text: 'Connect',
            tag: 'button',
          },
          10000,
        );

        await driver.delay(1000);

        // approve install of snap
        windowHandles = await driver.getAllWindowHandles();
        await driver.switchToWindowWithTitle(
          'MetaMask Notification',
          windowHandles,
        );
        await driver.clickElement({
          text: 'Approve & install',
          tag: 'button',
        });

        // wait for permissions popover, click checkboxes and confirm
        await driver.delay(1000);
        await driver.clickElement('#key-access-bip32-m-44h-0h-secp256k1-0');
        await driver.clickElement('#key-access-bip32-m-44h-0h-ed25519-0');
        await driver.clickElement({
          text: 'Confirm',
          tag: 'button',
        });

        // switch back to test-snaps window
        await driver.waitUntilXWindowHandles(2, 5000, 10000);
        windowHandles = await driver.getAllWindowHandles();
        await driver.switchToWindowWithTitle('Test Snaps', windowHandles);

        // wait then run SECP256K1 test
        await driver.delay(1000);
        await driver.fill('#bip32SignMessage', 'foo bar');
        await driver.clickElement('#sendBip32Secp256k1');

        // hit 'approve' on the custom confirm
        await driver.waitUntilXWindowHandles(2, 5000, 10000);
        windowHandles = await driver.getAllWindowHandles();
        await driver.switchToWindowWithTitle(
          'MetaMask Notification',
          windowHandles,
        );
        await driver.clickElement({
          text: 'Approve',
          tag: 'button',
        });

        await driver.waitUntilXWindowHandles(2, 5000, 10000);
        windowHandles = await driver.getAllWindowHandles();
        await driver.switchToWindowWithTitle('Test Snaps', windowHandles);

        // check result
        await driver.delay(1000);
        const secp256k1Result = await driver.findElement(
          '#bip32Secp256k1Result',
        );
        assert.equal(
          await secp256k1Result.getText(),
          'Signature: "0xd30561eb9e3195e47d49198fb0bc66eda867a7dff4c5e8b60c2ec13851aa7d8cc3d485da177de63dad331f315d440cbb693a629efe228389c4693ea90465b101"',
        );

        // wait then run ed25519 test
        await driver.delay(1000);
        await driver.clickElement('#sendBip32Ed25519');

        // hit 'approve' on the custom confirm
        await driver.waitUntilXWindowHandles(2, 5000, 10000);
        windowHandles = await driver.getAllWindowHandles();
        await driver.switchToWindowWithTitle(
          'MetaMask Notification',
          windowHandles,
        );
        await driver.clickElement({
          text: 'Approve',
          tag: 'button',
        });

        await driver.waitUntilXWindowHandles(2, 5000, 10000);
        windowHandles = await driver.getAllWindowHandles();
        await driver.switchToWindowWithTitle('Test Snaps', windowHandles);

        // check result
        await driver.delay(1000);
        const ed25519Result = await driver.findElement('#bip32Ed25519Result');
        assert.equal(
          await ed25519Result.getText(),
          'Signature: "0xf3215b4d6c59aac7e01b4ceef530d1e2abf4857926b85a81aaae3894505699243768a887b7da4a8c2e0f25196196ba290b6531050db8dc15c252bdd508532a0a"',
        );

        const publicKeyButton = await driver.findElement('#sendBip32PublicKey');
        await driver.scrollToElement(publicKeyButton);
        // wait then run public key test
        await driver.delay(1000);
        await driver.clickElement('#sendBip32PublicKey');
        // check result
        await driver.delay(1000);
        const publicKeyResult = await driver.findElement(
          '#bip32PublicKeyResult',
        );
        assert.equal(
          await publicKeyResult.getText(),
          'Public key: "043e98d696ae15caef75fa8dd204a7c5c08d1272b2218ba3c20feeb4c691eec366606ece56791c361a2320e7fad8bcbb130f66d51c591fc39767ab2856e93f8dfb"',
        );

        // wait then run compressed public key test
        await driver.delay(1000);
        await driver.clickElement('#sendBip32CompressedPublicKey');
        // check result
        await driver.delay(1000);
        const compressedPublicKeyResult = await driver.findElement(
          '#bip32CompressedPublicKeyResult',
        );
        assert.equal(
          await compressedPublicKeyResult.getText(),
          'Public key: "033e98d696ae15caef75fa8dd204a7c5c08d1272b2218ba3c20feeb4c691eec366"',
        );
      },
    );
  });
});
