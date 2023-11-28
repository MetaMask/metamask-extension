const { withFixtures, unlockWallet } = require('../helpers');
const FixtureBuilder = require('../fixture-builder');
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
        fixtures: new FixtureBuilder().build(),
        ganacheOptions,
        failOnConsoleError: false,
        title: this.test.fullTitle(),
      },
      async ({ driver }) => {
        await unlockWallet(driver);

        // navigate to test snaps page
        await driver.openNewPage(TEST_SNAPS_WEBSITE_URL);
        await driver.delay(1000);

        // find and scroll down to snapId5 and connect
        const snapButton = await driver.findElement('#connectnotifications');
        await driver.scrollToElement(snapButton);
        await driver.delay(1000);
        await driver.clickElement('#connectnotifications');
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

        await driver.waitForSelector({ text: 'Install' });

        await driver.clickElement({
          text: 'Install',
          tag: 'button',
        });

        await driver.waitForSelector({ text: 'OK' });

        await driver.clickElement({
          text: 'OK',
          tag: 'button',
        });

        // click send inputs on test snap page
        await driver.switchToWindowWithTitle('Test Snaps', windowHandles);

        // wait for npm installation success
        await driver.waitForSelector({
          css: '#connectnotifications',
          text: 'Reconnect to Notifications Snap',
        });

        await driver.clickElement('#sendInAppNotification');

        // switch back to the extension page
        await driver.switchToWindow(extensionPage);
        await driver.delay(1000);

        // check to see that there is one notification
        await driver.clickElement(
          '[data-testid="account-options-menu-button"]',
        );
        await driver.findElement({
          css: '[data-testid="global-menu-notification-count"]',
          text: '1',
        });
        await driver.clickElement('.menu__background');

        // try to click on the account menu icon (via xpath)
        await driver.clickElement(
          '[data-testid="account-options-menu-button"]',
        );
        await driver.delay(500);

        // try to click on the notification item (via xpath)
        await driver.clickElement({
          text: 'Notifications 1',
          css: '.menu-item',
        });
        await driver.delay(500);

        // look for the correct text in notifications (via xpath)
        await driver.findElement({
          css: '.notifications__item__details__message',
          text: 'Hello from within MetaMask!',
        });
      },
    );
  });
});
