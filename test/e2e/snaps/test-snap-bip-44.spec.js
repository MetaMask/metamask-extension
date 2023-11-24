const {
  withFixtures,
  unlockWallet,
  switchToNotificationWindow,
  WINDOW_TITLES,
} = require('../helpers');
const FixtureBuilder = require('../fixture-builder');
const { TEST_SNAPS_WEBSITE_URL } = require('./enums');

describe('Test Snap bip-44', function () {
  it('can pop up bip-44 snap and get private key result', async function () {
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

        // find and scroll to the bip44 test and connect
        const snapButton1 = await driver.findElement('#connectbip44');
        await driver.scrollToElement(snapButton1);
        await driver.delay(1000);
        await driver.clickElement('#connectbip44');
        await driver.delay(1000);

        // switch to metamask extension and click connect and approve
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

        // deal with permissions popover
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
        await driver.delay(500);
        const snapButton3 = await driver.findElement('#signBip44Message');
        await driver.scrollToElement(snapButton3);
        await driver.delay(500);
        await driver.clickElement('#signBip44Message');

        // Switch to approve signature message window and approve
        await switchToNotificationWindow(driver, 2);
        await driver.clickElement({
          text: 'Approve',
          tag: 'button',
        });

        // switch back to test-snaps page
        const windowHandles = await driver.waitUntilXWindowHandles(
          1,
          1000,
          10000,
        );
        await driver.switchToWindow(windowHandles[0]);

        // check the results of the message signature using waitForSelector
        await driver.waitForSelector({
          css: '#bip44SignResult',
          text: '"0xa41ab87ca50606eefd47525ad90294bbe44c883f6bc53655f1b8a55aa8e1e35df216f31be62e52c7a1faa519420e20810162e07dedb0fde2a4d997ff7180a78232ecd8ce2d6f4ba42ccacad33c5e9e54a8c4d41506bdffb2bb4c368581d8b086"',
        });
      },
    );
  });
});
