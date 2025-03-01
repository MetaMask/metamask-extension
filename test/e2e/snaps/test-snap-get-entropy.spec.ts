import { Suite } from 'mocha';
import { Driver } from '../webdriver/driver';
import { withFixtures, WINDOW_TITLES, unlockWallet } from '../helpers';
import FixtureBuilder from '../fixture-builder';
import { TEST_SNAPS_WEBSITE_URL } from './enums';

describe('Test Snap getEntropy', function (this: Suite) {
  it('can use snap_getEntropy inside a snap', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().withKeyringControllerMultiSRP().build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await unlockWallet(driver);

        // navigate to test snaps page and connect to get-entropy snap
        await driver.driver.get(TEST_SNAPS_WEBSITE_URL);

        // wait for page to load
        await driver.waitForSelector({
          text: 'Installed Snaps',
          tag: 'h2',
        });

        // scroll to get entropy snap
        const snapButton = await driver.findElement('#connectGetEntropySnap');
        await driver.scrollToElement(snapButton);

        // added delay for firefox (deflake)
        await driver.delayFirefox(1000);

        // wait for and click connect
        await driver.waitForSelector('#connectGetEntropySnap');
        await driver.clickElement('#connectGetEntropySnap');

        // switch to metamask extension
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

        // wait for and click connect
        await driver.waitForSelector({
          text: 'Connect',
          tag: 'button',
        });
        await driver.clickElement({
          text: 'Connect',
          tag: 'button',
        });

        // wait for confirm selector
        await driver.waitForSelector({ text: 'Confirm' });

        // dismiss possible scroll element
        await driver.clickElementSafe('[data-testid="snap-install-scroll"]');

        // click confirm button
        await driver.clickElement({
          text: 'Confirm',
          tag: 'button',
        });

        // wait for and click ok and wait for window to close
        await driver.waitForSelector({ text: 'OK' });
        await driver.clickElementAndWaitForWindowToClose({
          text: 'OK',
          tag: 'button',
        });

        // click send inputs on test snap page
        await driver.switchToWindowWithTitle(WINDOW_TITLES.TestSnaps);

        // wait for npm installation success
        await driver.waitForSelector({
          css: '#connectGetEntropySnap',
          text: 'Reconnect to Get Entropy Snap',
        });

        // find and click on send test
        await driver.pasteIntoField('#entropyMessage', '1234');
        const snapButton2 = await driver.findElement('#signEntropyMessage');
        await driver.scrollToElement(snapButton2);
        await driver.delay(500);
        await driver.clickElement('#signEntropyMessage');

        // Switch to approve signature message window.
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

        // Wait for and click on approve and wait for window to close.
        await driver.waitForSelector({
          text: 'Approve',
          tag: 'button',
        });
        await driver.clickElementAndWaitForWindowToClose({
          text: 'Approve',
          tag: 'button',
        });

        // Switch back to `test-snaps` page.
        await driver.switchToWindowWithTitle(WINDOW_TITLES.TestSnaps);

        // check the results of the message signature using waitForSelector
        await driver.waitForSelector({
          css: '#entropySignResult',
          text: '"0xad9e430e9fdab85a611ec9725e2c3a023c54dab5dbe40f0f51d0fc0503a48e1c9f5837b5c55a5fb1bbf18f8218de4fb309005a52ca1e6bf293a6fed77b30757642dff20f1a29f006125a8354b3d67253ac9952d43349c87503e114821dd3c888"',
        });

        // Select a different entropy source.
        const selector = await driver.findElement(
          '#get-entropy-entropy-selector',
        );
        await driver.scrollToElement(selector);
        await selector.click();

        await driver.clickElement({
          text: 'SRP 1 (primary)',
          tag: 'option',
        });

        // Change the message and sign.
        await driver.pasteIntoField('#entropyMessage', '5678');
        await driver.scrollToElement(snapButton2);
        await driver.delay(500);
        await driver.clickElement('#signEntropyMessage');

        // Switch to approve signature message window.
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

        // Wait for and click on approve and wait for window to close.
        await driver.waitForSelector({
          text: 'Approve',
          tag: 'button',
        });
        await driver.clickElementAndWaitForWindowToClose({
          text: 'Approve',
          tag: 'button',
        });

        // Switch back to `test-snaps` page.
        await driver.switchToWindowWithTitle(WINDOW_TITLES.TestSnaps);

        // Check the results of the message signature using `waitForSelector`.
        await driver.waitForSelector({
          css: '#entropySignResult',
          text: '"0x815abf3cda44b469a1d6f51aa7ff1e390d3352b6ee677119c68a04e3b1d2e06e2e611d4074fae930bf62c57b56859f4b0fb49d664763bab460f13f6919fc5dca452ecf6c72859bda39391a0cae0d4e4e4f50e039e41f29d69dfc83f35995e2b8"',
        });

        // Select a different entropy source.
        await driver.scrollToElement(selector);
        await selector.click();

        await driver.clickElement({
          text: 'SRP 2',
          tag: 'option',
        });

        // Sign a message with the new entropy source.
        await driver.clickElement('#signEntropyMessage');

        // Switch to approve signature message window.
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

        // Wait for and click on approve and wait for window to close.
        await driver.waitForSelector({
          text: 'Approve',
          tag: 'button',
        });
        await driver.clickElementAndWaitForWindowToClose({
          text: 'Approve',
          tag: 'button',
        });

        // Switch back to `test-snaps` page.
        await driver.switchToWindowWithTitle(WINDOW_TITLES.TestSnaps);

        // Check the results of the message signature using `waitForSelector`.
        await driver.waitForSelector({
          css: '#entropySignResult',
          text: '"0xad9ddfa10cb90467a229a7bcb70d78efe5b8241d9b8083d9610ae816ad7a3a20b1176bc0baa84b998330ace7f5ebb43d0591c96c42100605ba19d2073d4a790a513cbf54dd3893af4aa0b1fa8778c2ad35ed6fb231b8f981fc3d1663a07c4042"',
        });

        // Select an invalid (non-existent) entropy source.
        await driver.scrollToElement(selector);
        await selector.click();

        await driver.clickElement({
          text: 'Invalid',
          css: '#get-entropy-entropy-selector option',
        });

        // Sign a message with the new entropy source.
        await driver.clickElement('#signEntropyMessage');

        // Switch to approve signature message window.
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

        // Wait for and click on approve and wait for window to close.
        await driver.waitForSelector({
          text: 'Approve',
          tag: 'button',
        });
        await driver.clickElementAndWaitForWindowToClose({
          text: 'Approve',
          tag: 'button',
        });

        // Switch back to `test-snaps` page.
        await driver.switchToWindowWithTitle(WINDOW_TITLES.TestSnaps);

        // Check the error message and close the alert.
        await driver.waitForAlert(
          'Entropy source with ID "invalid" not found.',
        );
        await driver.closeAlertPopup();
      },
    );
  });
});
