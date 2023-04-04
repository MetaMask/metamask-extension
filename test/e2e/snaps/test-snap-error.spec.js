const { strict: assert } = require('assert');
const { withFixtures } = require('../helpers');
const FixtureBuilder = require('../fixture-builder');
const { TEST_SNAPS_WEBSITE_URL } = require('./enums');

describe('Test Snap Error', function () {
  it('can pop up a snap error and see the error', async function () {
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
        await driver.openNewPage(TEST_SNAPS_WEBSITE_URL);
        await driver.delay(1000);
        const snapButton = await driver.findElement('#connectErrorSnap');
        await driver.scrollToElement(snapButton);
        await driver.delay(1000);
        await driver.clickElement('#connectErrorSnap');
        await driver.delay(1000);

        // switch to metamask extension and click connect
        const windowHandles = await driver.waitUntilXWindowHandles(
          3,
          1000,
          10000,
        );
        const extensionPage = windowHandles[0];
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
          css: '#connectErrorSnap',
          text: 'Reconnect to Error Snap',
        });

        // find and click on send error
        await driver.clickElement('#sendError');

        // switch back to the extension page
        await driver.switchToWindow(extensionPage);
        await driver.delay(1000);

        // look for the actual error and check if it is correct
        const error = await driver.findElement(
          '.home-notification__content-container',
        );
        const text = await error.getText();
        assert.equal(
          text.includes(
            "Snap Error: 'random error inside'. Error Code: '-32603'",
          ),
          true,
        );

        // try to click on the dismiss button and pass test if it works
        await driver.clickElement({
          text: 'Dismiss',
          tag: 'button',
        });
      },
    );
  });
});
