const {
  defaultGanacheOptions,
  withFixtures,
  unlockWallet,
  WINDOW_TITLES,
} = require('../helpers');
const FixtureBuilder = require('../fixture-builder');
const { TEST_SNAPS_WEBSITE_URL } = require('./enums');

describe('Test Snap Management', function () {
  it('tests install disable enable and removal of a snap', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        ganacheOptions: defaultGanacheOptions,
        title: this.test.fullTitle(),
      },
      async ({ driver }) => {
        await unlockWallet(driver);

        // open a new tab and navigate to test snaps page and connect
        await driver.openNewPage(TEST_SNAPS_WEBSITE_URL);

        // wait for page to load
        await driver.waitForSelector({
          text: 'Installed Snaps',
          tag: 'h2',
        });

        // find and scroll to the notifications card and click first
        const snapButton = await driver.findElement('#connectnotifications');
        await driver.scrollToElement(snapButton);
        await driver.delay(1000);
        await driver.clickElement('#connectnotifications');

        // switch to metamask extension and click connect
        let windowHandles = await driver.waitUntilXWindowHandles(
          3,
          1000,
          10000,
        );
        await driver.switchToWindowWithTitle(
          WINDOW_TITLES.Dialog,
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

        // switch to the original MM tab
        const extensionPage = windowHandles[0];
        await driver.switchToWindow(extensionPage);

        // click on the global action menu
        await driver.waitForSelector(
          '[data-testid="account-options-menu-button"]',
        );
        await driver.clickElement(
          '[data-testid="account-options-menu-button"]',
        );

        // try to click on the snaps item
        await driver.clickElement({
          text: 'Snaps',
          tag: 'div',
        });

        // try to disable the snap
        await driver.waitForSelector({
          text: 'Notifications Example Snap',
          tag: 'p',
        });
        await driver.clickElement({
          text: 'Notifications Example Snap',
          tag: 'p',
        });
        await driver.clickElement('.toggle-button > div');

        // switch back to test-snaps window
        windowHandles = await driver.waitUntilXWindowHandles(2, 1000, 10000);
        await driver.switchToWindowWithTitle('Test Snaps', windowHandles);

        // wait then try the notification test
        await driver.waitForSelector('#sendInAppNotification');
        await driver.clickElement('#sendInAppNotification');

        // click OK on the popup
        await driver.delay(1000);
        await driver.closeAlertPopup();

        // switch back to snaps page
        await driver.switchToWindow(extensionPage);

        // try to re-enaable the snap
        await driver.waitForSelector('.toggle-button > div');
        await driver.clickElement('.toggle-button > div');

        // switch back to test snaps page
        await driver.switchToWindowWithTitle('Test Snaps', windowHandles);

        // wait then try the notification test
        await driver.waitForSelector('#sendInAppNotification');
        await driver.clickElement('#sendInAppNotification');

        // check to see that there is one notification
        await driver.switchToWindow(extensionPage);
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

        // try to remove snap
        await driver.clickElement({
          text: 'Remove Notifications Example Snap',
          tag: 'p',
        });

        // try to click remove on popover
        await driver.waitForSelector('#popoverRemoveSnapButton');
        await driver.clickElement('#popoverRemoveSnapButton');

        // check the results of the removal
        await driver.waitForSelector({
          css: '.mm-box',
          text: "You don't have any snaps installed.",
          tag: 'p',
        });
      },
    );
  });
});
