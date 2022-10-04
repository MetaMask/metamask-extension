const { strict: assert } = require('assert');
const { withFixtures } = require('../helpers');
const FixtureBuilder = require('../fixture-builder');
const { TEST_SNAPS_WEBSITE_URL } = require('./enums');

describe('Test Snap update', function () {
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
        fixtures: new FixtureBuilder()
          .withPermissionControllerConnectedToSnapDapp()
          .build(),
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
        await driver.fill('#snapId7', 'npm:@metamask/test-snap-confirm');
        await driver.clickElement('#connectUpdateOld');

        // approve install of snap
        let windowHandles = await driver.getAllWindowHandles();
        const extensionPage = windowHandles[0];
        await driver.switchToWindowWithTitle(
          'MetaMask Notification',
          windowHandles,
        );
        await driver.clickElement({
          text: 'Approve & install',
          tag: 'button',
        });

        // navigate to test snap page
        await driver.waitUntilXWindowHandles(2, 5000, 10000);
        windowHandles = await driver.getAllWindowHandles();
        await driver.switchToWindowWithTitle('Test Snaps', windowHandles);
        await driver.delay(1000);

        // find and scroll to the correct card and click first
        const snapButton2 = await driver.findElement('#snapId7');
        await driver.scrollToElement(snapButton2);
        await driver.delay(500);
        await driver.clickElement('#connectUpdateNew');

        // switch to metamask extension and click connect
        await driver.waitUntilXWindowHandles(3, 5000, 10000);
        await driver.delay(1000);

        // approve update of snap
        windowHandles = await driver.getAllWindowHandles();
        await driver.switchToWindowWithTitle(
          'MetaMask Notification',
          windowHandles,
        );
        await driver.clickElement({
          text: 'Approve & update',
          tag: 'button',
        });

        // switch to the original MM tab
        await driver.switchToWindow(extensionPage);
        await driver.delay(500);

        // click on the account menu icon
        await driver.clickElement('.account-menu__icon');
        await driver.delay(500);

        // try to click on the notification item
        await driver.clickElement({
          text: 'Settings',
          tag: 'div',
        });
        await driver.delay(500);

        // try to click on the snaps item
        await driver.clickElement({
          text: 'Snaps',
          tag: 'div',
        });
        await driver.delay(500);

        // look for the correct version text
        const versionResult = await driver.findElement(
          '.snap-settings-card__version',
        );
        assert.equal(await versionResult.getText(), 'v2.0.0');
      },
    );
  });
});
