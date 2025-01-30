const {
  defaultGanacheOptions,
  withFixtures,
  unlockWallet,
  WINDOW_TITLES,
} = require('../helpers');
const FixtureBuilder = require('../fixture-builder');
const { TEST_SNAPS_WEBSITE_URL } = require('./enums');

describe('Test Snap bip-32', function () {
  it('tests various functions of bip-32', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        ganacheOptions: defaultGanacheOptions,
        title: this.test.fullTitle(),
      },
      async ({ driver }) => {
        await unlockWallet(driver);

        // navigate to test snaps page and connect
        await driver.driver.get(TEST_SNAPS_WEBSITE_URL);

        // wait for page to load
        await driver.waitForSelector({
          text: 'Installed Snaps',
          tag: 'h2',
        });

        // find and scroll to the bip32 snap
        const snapButton1 = await driver.findElement('#connectbip32');
        await driver.scrollToElement(snapButton1);

        // added delay for firefox (deflake)
        await driver.delayFirefox(3000);

        // wait for and click connect to bip-32
        await driver.waitForSelector('#connectbip32');
        await driver.clickElement('#connectbip32');

        // switch to metamask extension and click connect
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
        await driver.waitForSelector({
          text: 'Connect',
          tag: 'button',
        });
        await driver.clickElement({
          text: 'Connect',
          tag: 'button',
        });

        // wait for confirm to appear
        await driver.waitForSelector({ text: 'Confirm' });

        // click and dismiss possible scroll element
        await driver.clickElementSafe('[data-testid="snap-install-scroll"]');

        // click confirm
        await driver.clickElement({
          text: 'Confirm',
          tag: 'button',
        });

        // wait for permissions popover, click checkboxes and confirm
        await driver.waitForSelector('.mm-checkbox__input');
        await driver.clickElement('.mm-checkbox__input');
        await driver.waitForSelector(
          '[data-testid="snap-install-warning-modal-confirm"]',
        );
        await driver.clickElement(
          '[data-testid="snap-install-warning-modal-confirm"]',
        );

        // wait for and click OK and wait for window to close
        await driver.waitForSelector({ text: 'OK' });
        await driver.clickElementAndWaitForWindowToClose({
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

        // hit 'approve' on the signature confirmation and wait for window to close
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
        await driver.clickElementAndWaitForWindowToClose({
          text: 'Approve',
          tag: 'button',
        });

        // switch back to the test-snaps window
        await driver.switchToWindowWithTitle(WINDOW_TITLES.TestSnaps);

        // check results of the secp256k1 signature with waitForSelector
        await driver.waitForSelector({
          css: '#bip32MessageResult-secp256k1',
          text: '"0x3045022100b3ade2992ea3e5eb58c7550e9bddad356e9554233c8b099ebc3cb418e9301ae2022064746e15ae024808f0ba5d860e44dc4c97e65c8cba6f5ef9ea2e8c819930d2dc',
        });

        // scroll further into messages section
        const snapButton4 = await driver.findElement('#sendBip32-ed25519');
        await driver.scrollToElement(snapButton4);

        // wait then run ed25519 test
        await driver.waitForSelector('#bip32Message-ed25519');
        await driver.fill('#bip32Message-ed25519', 'foo bar');
        await driver.clickElement('#sendBip32-ed25519');

        // switch to dialog window
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

        // wait for and click 'approve' and wait for window to close
        await driver.waitForSelector({
          text: 'Approve',
          tag: 'button',
        });
        await driver.clickElementAndWaitForWindowToClose({
          text: 'Approve',
          tag: 'button',
        });

        // switch back to test-snaps window
        await driver.switchToWindowWithTitle(WINDOW_TITLES.TestSnaps);

        // check results of ed25519 signature with waitForSelector
        await driver.waitForSelector({
          css: '#bip32MessageResult-ed25519',
          text: '"0xf3215b4d6c59aac7e01b4ceef530d1e2abf4857926b85a81aaae3894505699243768a887b7da4a8c2e0f25196196ba290b6531050db8dc15c252bdd508532a0a"',
        });
      },
    );
  });
});
