const { strict: assert } = require('assert');
const { withFixtures } = require('../helpers');
const FixtureBuilder = require('../fixture-builder');
const { TEST_SNAPS_WEBSITE_URL } = require('./enums');

describe('Test Snap Management', function () {
  it('tests install disable enable and removal of a snap', async function () {
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

        // open a new tab and navigate to test snaps page and connect
        await driver.openNewPage(TEST_SNAPS_WEBSITE_URL);
        await driver.delay(1000);

        // find and scroll to the correct card and click first
        const snapButton = await driver.findElement('#connectNotification');
        await driver.scrollToElement(snapButton);
        await driver.delay(1000);
        await driver.clickElement('#connectNotification');
        await driver.delay(1000);

        // switch to metamask extension and click connect
        let windowHandles = await driver.waitUntilXWindowHandles(
          3,
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

        // switch to the original MM tab
        const extensionPage = windowHandles[0];
        await driver.switchToWindow(extensionPage);
        await driver.delay(1000);

        // click on the global action menu
        await driver.clickElement(
          '[data-testid="account-options-menu-button"]',
        );

        // try to click on the notification item
        await driver.clickElement({ text: 'Settings', tag: 'div' });
        await driver.delay(1000);

        // try to click on the snaps item
        await driver.clickElement({
          text: 'Snaps',
          tag: 'div',
        });
        await driver.delay(1000);

        // try to disable the snap
        await driver.clickElement({
          text: 'Notification Test Snap',
          tag: 'p',
        });
        await driver.clickElement('.toggle-button > div');

        // switch back to test-snaps window
        windowHandles = await driver.waitUntilXWindowHandles(2, 1000, 10000);
        await driver.switchToWindowWithTitle('Test Snaps', windowHandles);

        // wait then try the notification test
        await driver.delay(1000);
        await driver.clickElement('#sendInAppNotification');

        // click OK on the popup
        await driver.delay(1000);
        await driver.closeAlertPopup();
        await driver.delay(1000);

        // switch back to snaps page
        await driver.switchToWindow(extensionPage);
        await driver.delay(1000);

        // try to re-enaable the snap
        await driver.clickElement('.toggle-button > div');
        await driver.delay(1000);

        // switch back to test snaps page
        await driver.switchToWindowWithTitle('Test Snaps', windowHandles);

        // wait then try the notification test
        await driver.delay(1000);
        await driver.clickElement('#sendInAppNotification');

        // check to see that there is one notification
        await driver.switchToWindow(extensionPage);
        await driver.delay(1000);
        const notificationResult = await driver.findElement(
          '.account-menu__icon__notification-count',
        );
        assert.equal(await notificationResult.getText(), '1');

        // try to remove snap
        await driver.clickElement({
          text: 'Remove Notification Test Snap',
          tag: 'p',
        });
        await driver.delay(1000);

        // try to click remove on popover
        await driver.clickElement('#popoverRemoveSnapButton');
        await driver.delay(1000);

        // check the results of the removal
        await driver.delay(2000);
        const removeResult = await driver.findElement(
          '.snap-list-tab__container--no-snaps_inner',
        );
        assert.equal(
          await removeResult.getText(),
          "You don't have any snaps installed.",
        );
      },
    );
  });
});
