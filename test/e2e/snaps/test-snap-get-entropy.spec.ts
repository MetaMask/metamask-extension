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
          text: '"0xb6c421dfcb510a89cb39116f9d0fcd6f06ffc3f83801d952ec2f5aa12e14f0da6194a4149bf4c66272987eda48fdeaf80b4a27b95c91a0fe9084469767c8579df4bf4e7abfa79d026234073d2ca1ab99779ccbbbf99095c2ee3a649e0042a166"',
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
          text: '"0xa7181c5c40af3fc4a7202720b10e517fba904f28fbf199d97f266371e602cdcddff2e9b296c0aaf8ccf16098db9aa4260f06a560423e3a8520be2889e8d02e9e3f4d3bbfc1367b8dfcb175f7ed29d6ec7d02b4696a01798060a33226dabe5ffc"',
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
