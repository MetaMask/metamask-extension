const { withFixtures } = require('../helpers');
const FixtureBuilder = require('../fixture-builder');
const { TEST_SNAPS_WEBSITE_URL } = require('./enums');

describe('Test Snap getEntropy', function () {
  it('can use snap_getEntropy inside a snap', async function () {
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
        title: this.test.title,
      },
      async ({ driver }) => {
        await driver.navigate();

        // enter pw into extension
        await driver.fill('#password', 'correct horse battery staple');
        await driver.press('#password', driver.Key.ENTER);

        // navigate to test snaps page and connect
        await driver.driver.get(TEST_SNAPS_WEBSITE_URL);
        await driver.delay(1000);
        const snapButton = await driver.findElement('#connectGetEntropySnap');
        await driver.scrollToElement(snapButton);
        await driver.delay(1000);
        await driver.clickElement('#connectGetEntropySnap');
        await driver.delay(1000);

        // switch to metamask extension and click connect
        let windowHandles = await driver.waitUntilXWindowHandles(
          2,
          1000,
          10000,
        );
        await driver.switchToWindowWithTitle(
          'MetaMask Notification',
          windowHandles,
        );
        await driver.clickElement({
          text: 'Connect',
          tag: 'button',
        });

        await driver.waitForSelector({ text: 'Approve & install' });

        await driver.clickElement({
          text: 'Approve & install',
          tag: 'button',
        });

        await driver.waitForSelector({ text: 'Ok' });

        await driver.clickElement({
          text: 'Ok',
          tag: 'button',
        });

        // click send inputs on test snap page
        await driver.switchToWindowWithTitle('Test Snaps', windowHandles);

        // wait for npm installation success
        await driver.waitForSelector({
          css: '#connectGetEntropySnap',
          text: 'Reconnect to getEntropy Snap',
        });

        // find and click on send test
        await driver.pasteIntoField('#entropyMessage', '1234');
        await driver.delay(500);
        const snapButton2 = await driver.findElement('#signEntropyMessage');
        await driver.scrollToElement(snapButton2);
        await driver.delay(500);
        await driver.clickElement('#signEntropyMessage');

        // Switch to approve signature message window and approve
        windowHandles = await driver.waitUntilXWindowHandles(2, 1000, 10000);
        await driver.switchToWindowWithTitle(
          'MetaMask Notification',
          windowHandles,
        );
        await driver.clickElement({
          text: 'Approve',
          tag: 'button',
        });

        // switch back to test-snaps page
        windowHandles = await driver.waitUntilXWindowHandles(1, 1000, 10000);
        await driver.switchToWindowWithTitle('Test Snaps', windowHandles);

        // check the results of the message signature using waitForSelector
        await driver.waitForSelector({
          css: '#entropySignResult',
          text: '"0xb9c20d675976e12c8bb53c3fd8fdff2dee11ad2b132eb453b5a8f35b0553c52d3bcac0fd3324d22ff0c53b3445ef48c119ba6435bc9bfb03234806719599aa6f6245593238c734bcf9d94d2873cacdd65a3176be3ae7e5b84f95fdd4487a395f"',
        });
      },
    );
  });
});
