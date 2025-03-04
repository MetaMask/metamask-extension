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
          text: '"0x9341785782b512c86235612365f1076b16731ed9473beb4d0804c30b7fcc3a055aa7103b02dc64014d923220712dfbef023ddcf6327b313ea2dfd4d83dc5a53e1c5e7f4e10bce49830eded302294054df8a7a46e5b6cb3e50eec564ecba17941"',
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
          text: '"0xadd276f9d715223dcd20a595acb475f9b7353c451a57af64efb23633280c21aa172bd6689c27a0ac3c003ec4469b093207db956a6bf76689b3cc0b710c4187d5fcdca5f09c9594f146c9a39461e2f6cb03a446f4e62bd341a448ca9a33e96cf2"',
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
          text: '"0xa1dba3ddefabb56c5d6d37135fd07752662b5d720c005d619c0ff49eede2fe6f92a3e88e70ff4bb706b9ec2a076925ec159e3f6aa7170d51e428ccafe2353dd858da425c075912f0cd78c750942afef230393dff20d9fb58de14c56a5cd213b1"',
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
