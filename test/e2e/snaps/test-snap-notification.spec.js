const { strict: assert } = require('assert');
const { withFixtures } = require('../helpers');
const { PAGES } = require('../webdriver/driver');
const { TEST_SNAPS_WEBSITE_URL } = require('./enums');

describe('Test Snap Notification', function () {
  it('can send 1 correctly read inapp notification', async function () {
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
        fixtures: 'imported-account',
        ganacheOptions,
        title: this.test.title,
        driverOptions: {
          type: 'flask',
        },
      },
      async ({ driver }) => {
        await driver.navigate();

        // enter pw into extension
        await driver.fill('#password', 'correct horse battery staple');
        await driver.press('#password', driver.Key.ENTER);

        // navigate to test snaps page
        await driver.driver.get(TEST_SNAPS_WEBSITE_URL);
        await driver.delay(1000);

        // find and scroll down to snapId5
        const snapButton = await driver.findElement('#snapId5');
        await driver.scrollToElement(snapButton);
        await driver.delay(500);
        await driver.fill('#snapId5', 'npm:@metamask/test-snap-notification');

        // connect the snap
        await driver.clickElement('#connectNotification');

        // switch to metamask extension and click connect
        await driver.waitUntilXWindowHandles(2, 5000, 10000);
        let windowHandles = await driver.getAllWindowHandles();
        await driver.switchToWindowWithTitle(
          'MetaMask Notification',
          windowHandles,
        );
        await driver.clickElement(
          {
            text: 'Connect',
            tag: 'button',
          },
          10000,
        );
        await driver.delay(2000);

        // approve install of snap
        await driver.waitUntilXWindowHandles(2, 5000, 10000);
        windowHandles = await driver.getAllWindowHandles();
        await driver.switchToWindowWithTitle(
          'MetaMask Notification',
          windowHandles,
        );
        await driver.clickElement({
          text: 'Approve & Install',
          tag: 'button',
        });

        // click send inputs on test snap page
        await driver.waitUntilXWindowHandles(1, 5000, 10000);
        windowHandles = await driver.getAllWindowHandles();
        await driver.switchToWindowWithTitle('Test Snaps', windowHandles);
        await driver.clickElement('#sendInAppNotification');

        // try to go to the MM pages
        await driver.navigate(PAGES.HOME);
        await driver.delay(1500);

        // check to see that there is one notification
        const notificationResult = await driver.findElement(
          '.account-menu__icon__notification-count',
        );
        assert.equal(await notificationResult.getText(), '1');

        // try to click on the account menu icon (via xpath)
        await driver.clickElement('.account-menu__icon');
        await driver.delay(500);

        // try to click on the notification item (via xpath)
        await driver.clickElement({
          text: 'Notifications',
          tag: 'div',
        });
        await driver.delay(500);

        // look for the correct text in notifications (via xpath)
        const notificationResultMessage = await driver.findElement(
          '.notifications__item__details__message',
        );
        assert.equal(
          await notificationResultMessage.getText(),
          'TEST INAPP NOTIFICATION',
        );
      },
    );
  });
});
