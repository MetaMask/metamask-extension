const { strict: assert } = require('assert');
const { withFixtures } = require('../helpers');
const { TEST_SNAPS_WEBSITE_URL } = require('./enums');

describe('Test Snap bip-32', function () {
  it('can install an old and then updated version', async function () {
    const ganacheOptions = {
      accounts: [
        {
          secretKey:
            '0x7C9529A67102755B7E6102D6D950AC5D5863C98713805CEC576B945B15B71EAC',
          balance: 25000000000000000000,
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
        await driver.clickElement('#sendBip32Secp256k1');
        // check result
        await driver.delay(1000);
        const secp256k1Result = await driver.findElement(
          '#bip32Secp256k1Result',
        );
        assert.equal(
          await secp256k1Result.getText(),
          'Private key: "f08319688099bba37c3e5d4af2579869367699da152621db80082820372ceba9"',
        );

        // wait then run ed25519 test
        await driver.delay(1000);
        await driver.clickElement('#sendBip32Ed25519');
        // check result
        await driver.delay(1000);
        const ed25519Result = await driver.findElement('#bip32Ed25519Result');
        assert.equal(
          await ed25519Result.getText(),
          'Private key: "9288ab958034e379f5c6df2533067f05da18f3552b87a99e6292ae03e44f6ac7"',
        );

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

        // wait then send invalid test
        await driver.delay(1000);
        await driver.clickElement('#sendBip32Invalid');
      },
    );
  });
});
