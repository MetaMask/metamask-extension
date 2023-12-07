const {
  withFixtures,
  unlockWallet,
  switchToNotificationWindow,
  WINDOW_TITLES,
} = require('../helpers');
const FixtureBuilder = require('../fixture-builder');
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
        fixtures: new FixtureBuilder().build(),
        ganacheOptions,
        failOnConsoleError: false,
        title: this.test.fullTitle(),
      },
      async ({ driver }) => {
        await unlockWallet(driver);

        // navigate to test snaps page and connect
        await driver.driver.get(TEST_SNAPS_WEBSITE_URL);
        await driver.delay(1000);

        // find and scroll to the bip32 test and connect
        const snapButton1 = await driver.findElement('#connectbip32');
        await driver.scrollToElement(snapButton1);
        await driver.delay(1000);
        await driver.clickElement('#connectbip32');
        await driver.delay(1000);

        // switch to metamask extension and click connect
        await switchToNotificationWindow(driver, 2);
        await driver.clickElement({
          text: 'Connect',
          tag: 'button',
        });

        await driver.waitForSelector({ text: 'Install' });

        await driver.clickElementSafe('[data-testid="snap-install-scroll"]');

        await driver.clickElement({
          text: 'Install',
          tag: 'button',
        });

        // wait for permissions popover, click checkboxes and confirm
        await driver.delay(500);
        await driver.clickElement('.mm-checkbox__input');
        await driver.clickElement({
          text: 'Confirm',
          tag: 'button',
        });

        await driver.waitForSelector({ text: 'OK' });
        await driver.clickElement({
          text: 'OK',
          tag: 'button',
        });

        // switch back to test-snaps window
        await driver.switchToWindowWithTitle(WINDOW_TITLES.TestSnaps);

        // wait for npm installation success
        await driver.waitForSelector({
          css: '#connectbip32',
          text: 'Reconnect to BIP-32 Snap',
        });

        // scroll to and click get public key
        await driver.delay(1000);
        await driver.waitForSelector({ text: 'Get Public Key' });
        await driver.clickElement('#bip32GetPublic');

        // check for proper public key response using waitForSelector
        await driver.waitForSelector({
          css: '#bip32PublicKeyResult',
          text: '"0x043e98d696ae15caef75fa8dd204a7c5c08d1272b2218ba3c20feeb4c691eec366606ece56791c361a2320e7fad8bcbb130f66d51c591fc39767ab2856e93f8dfb',
        });

        // scroll to and click get compressed public key
        await driver.waitForSelector({ text: 'Get Compressed Public Key' });
        await driver.clickElement('#bip32GetCompressedPublic');

        // check for proper public key response using waitForSelector
        await driver.waitForSelector({
          css: '#bip32PublicKeyResult',
          text: '"0x033e98d696ae15caef75fa8dd204a7c5c08d1272b2218ba3c20feeb4c691eec366',
        });

        // wait then run SECP256K1 test
        await driver.fill('#bip32Message-secp256k1', 'foo bar');
        await driver.clickElement('#sendBip32-secp256k1');

        // hit 'approve' on the signature confirmation
        await switchToNotificationWindow(driver, 2);
        await driver.clickElement({
          text: 'Approve',
          tag: 'button',
        });

        // switch back to the test-snaps window
        let windowHandles = await driver.waitUntilXWindowHandles(
          1,
          1000,
          10000,
        );
        await driver.switchToWindow(windowHandles[0]);

        // check results of the secp256k1 signature with waitForSelector
        await driver.waitForSelector({
          css: '#bip32MessageResult-secp256k1',
          text: '"0x3045022100b3ade2992ea3e5eb58c7550e9bddad356e9554233c8b099ebc3cb418e9301ae2022064746e15ae024808f0ba5d860e44dc4c97e65c8cba6f5ef9ea2e8c819930d2dc',
        });

        // scroll further into messages section
        const snapButton4 = await driver.findElement('#sendBip32-ed25519');
        await driver.scrollToElement(snapButton4);

        // wait then run ed25519 test
        await driver.delay(500);
        await driver.fill('#bip32Message-ed25519', 'foo bar');
        await driver.clickElement('#sendBip32-ed25519');

        // hit 'approve' on the custom confirm
        await switchToNotificationWindow(driver, 2);
        await driver.clickElement({
          text: 'Approve',
          tag: 'button',
        });

        windowHandles = await driver.waitUntilXWindowHandles(1, 1000, 10000);
        await driver.switchToWindow(windowHandles[0]);

        // check results of ed25519 signature with waitForSelector
        await driver.waitForSelector({
          css: '#bip32MessageResult-ed25519',
          text: '"0xf3215b4d6c59aac7e01b4ceef530d1e2abf4857926b85a81aaae3894505699243768a887b7da4a8c2e0f25196196ba290b6531050db8dc15c252bdd508532a0a"',
        });
      },
    );
  });
});
