const {
  defaultGanacheOptions,
  withFixtures,
  unlockWallet,
  WINDOW_TITLES,
} = require('../helpers');
const FixtureBuilder = require('../fixture-builder');
const { TEST_SNAPS_WEBSITE_URL } = require('./enums');

describe('Test Snap Notification', function () {
  it('can send 1 correctly read in-app notification', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        ganacheOptions: defaultGanacheOptions,
        title: this.test.fullTitle(),
      },
      async ({ driver }) => {
        await unlockWallet(driver);

        // navigate to test snaps page
        await driver.openNewPage(TEST_SNAPS_WEBSITE_URL);

        // wait for page to load
        await driver.waitForSelector({
          text: 'Installed Snaps',
          tag: 'h2',
        });

        // scroll to notifications snap
        const snapButton = await driver.findElement('#connectnotifications');
        await driver.scrollToElement(snapButton);

        // added delay for firefox (deflake)
        await driver.delay(1000);

        // wait for and click connect
        await driver.waitForSelector('#connectnotifications');
        await driver.clickElement('#connectnotifications');

        // switch to metamask extension and click connect
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
        await driver.clickElement({
          text: 'Connect',
          tag: 'button',
        });

        // wait for and click confirm
        await driver.waitForSelector({ text: 'Confirm' });
        await driver.clickElement({
          text: 'Confirm',
          tag: 'button',
        });

        // wait for and click ok
        await driver.waitForSelector({ text: 'OK' });
        await driver.clickElement({
          text: 'OK',
          tag: 'button',
        });

        // click send inputs on test snap page
        await driver.switchToWindowWithTitle(WINDOW_TITLES.TestSnaps);

        // wait for npm installation success
        await driver.waitForSelector({
          css: '#connectnotifications',
          text: 'Reconnect to Notifications Snap',
        });

        // click to send notification
        await driver.clickElement('#sendInAppNotification');

        // switch back to the extension page
        await driver.switchToWindowWithTitle(
          WINDOW_TITLES.ExtensionInFullScreenView,
        );

        // check to see that there is one notification
        await driver.waitForSelector(
          '[data-testid="account-options-menu-button"]',
        );
        await driver.clickElement(
          '[data-testid="account-options-menu-button"]',
        );
        await driver.findElement({
          css: '[data-testid="global-menu-notification-count"]',
          text: '1',
        });
        // this click will close the menu
        await driver.clickElement(
          '[data-testid="account-options-menu-button"]',
        );

        // try to click on the account menu icon (via xpath)
        await driver.clickElement(
          '[data-testid="account-options-menu-button"]',
        );

        // try to click on the notification item (via xpath)
        await driver.waitForSelector({
          text: 'Notifications 1',
          css: '.menu-item',
        });
        await driver.clickElement({
          text: 'Notifications 1',
          css: '.menu-item',
        });

        // look for the correct text in notifications (via xpath)
        await driver.waitForSelector({
          css: '.snap-notifications__item__details__message',
          text: 'Hello from within MetaMask!',
        });
        await driver.findElement({
          css: '.snap-notifications__item__details__message',
          text: 'Hello from within MetaMask!',
        });
      },
    );
  });
});
