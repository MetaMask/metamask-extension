const {
  defaultGanacheOptions,
  withFixtures,
  unlockWallet,
  WINDOW_TITLES,
} = require('../helpers');
const FixtureBuilder = require('../fixture-builder');
const { TEST_SNAPS_WEBSITE_URL } = require('./enums');

describe('Test Snap bip-44', function () {
  it('can pop up bip-44 snap and get private key result', async function () {
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

        // find and scroll to the bip44 snap
        const snapButton1 = await driver.findElement('#connectbip44');
        await driver.scrollToElement(snapButton1);

        // added delay for firefox (deflake)
        await driver.delayFirefox(1000);

        // wait for and click connect
        await driver.waitForSelector('#connectbip44');
        await driver.clickElement('#connectbip44');

        // switch to metamask extension and click connect and approve
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
        await driver.clickElement({
          text: 'Connect',
          tag: 'button',
        });
        await driver.waitForSelector({ text: 'Confirm' });

        await driver.clickElementSafe('[data-testid="snap-install-scroll"]');

        await driver.clickElement({
          text: 'Confirm',
          tag: 'button',
        });

        // deal with permissions popover
        await driver.waitForSelector('.mm-checkbox__input');
        await driver.clickElement('.mm-checkbox__input');
        await driver.waitForSelector(
          '[data-testid="snap-install-warning-modal-confirm"]',
        );
        await driver.clickElement(
          '[data-testid="snap-install-warning-modal-confirm"]',
        );

        // wait for and click ok and wait for window to close
        await driver.waitForSelector({ text: 'OK' });
        await driver.clickElementAndWaitForWindowToClose({
          text: 'OK',
          tag: 'button',
        });

        // switch back to test-snaps window
        await driver.switchToWindowWithTitle(WINDOW_TITLES.TestSnaps);

        // wait for npm installation success
        await driver.waitForSelector({
          css: '#connectbip44',
          text: 'Reconnect to BIP-44 Snap',
        });

        // find and click bip44 test
        await driver.clickElement('#sendBip44Test');

        // check the results of the public key test using waitForSelector
        await driver.waitForSelector({
          css: '#bip44Result',
          text: '"0x86debb44fb3a984d93f326131d4c1db0bc39644f1a67b673b3ab45941a1cea6a385981755185ac4594b6521e4d1e08d1"',
        });

        // enter a message to sign
        await driver.pasteIntoField('#bip44Message', '1234');
        const snapButton3 = await driver.findElement('#signBip44Message');
        await driver.scrollToElement(snapButton3);
        await driver.waitForSelector('#signBip44Message');
        await driver.clickElement('#signBip44Message');

        // Switch to approve signature message window
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

        // wait for and click approve and wait for window to close
        await driver.waitForSelector({
          text: 'Approve',
          tag: 'button',
        });
        await driver.clickElementAndWaitForWindowToClose({
          text: 'Approve',
          tag: 'button',
        });

        // switch back to test-snaps page
        await driver.switchToWindowWithTitle(WINDOW_TITLES.TestSnaps);

        // check the results of the message signature using waitForSelector
        await driver.waitForSelector({
          css: '#bip44SignResult',
          text: '"0xa41ab87ca50606eefd47525ad90294bbe44c883f6bc53655f1b8a55aa8e1e35df216f31be62e52c7a1faa519420e20810162e07dedb0fde2a4d997ff7180a78232ecd8ce2d6f4ba42ccacad33c5e9e54a8c4d41506bdffb2bb4c368581d8b086"',
        });
      },
    );
  });
});
