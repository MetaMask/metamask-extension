const {
  withFixtures,
  switchToNotificationWindow,
  unlockWallet,
} = require('../helpers');
const FixtureBuilder = require('../fixture-builder');
const { TEST_SNAPS_WEBSITE_URL } = require('./enums');

describe('Test Snap update via snaps component', function () {
  it('can install an old and then update via the snaps component', async function () {
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
        title: this.test.fullTitle(),
      },
      async ({ driver }) => {
        await unlockWallet(driver);

        // open a new tab and navigate to test snaps page
        await driver.openNewPage(TEST_SNAPS_WEBSITE_URL);

        // wait for page to load
        await driver.waitForSelector({
          text: 'Installed Snaps',
          tag: 'h2',
        });

        // find and scroll to the correct card and connect to update snap
        const snapButton = await driver.findElement('#connectUpdate');
        await driver.scrollToElement(snapButton);
        await driver.delay(1000);
        await driver.clickElement('#connectUpdate');

        // switch to metamask extension and click connect
        await switchToNotificationWindow(driver, 3);
        await driver.clickElement({
          text: 'Connect',
          tag: 'button',
        });

        await driver.waitForSelector({ text: 'Install' });

        await driver.clickElementSafe('[data-testid="snap-install-scroll"]');

        await driver.clickElement({
          text: 'Install',
          tag: 'button',
        });

        // wait for permissions popover, click checkboxes and confirm
        await driver.waitForSelector('.mm-checkbox__input');
        await driver.clickElement('.mm-checkbox__input');
        await driver.clickElement({
          text: 'Confirm',
          tag: 'button',
        });

        await driver.waitForSelector({ text: 'OK' });

        await driver.clickElement({
          text: 'OK',
          tag: 'button',
        });

        // navigate to test snap page
        const windowHandles = await driver.waitUntilXWindowHandles(
          2,
          1000,
          10000,
        );
        await driver.switchToWindow(windowHandles[1]);

        // wait for npm installation success
        await driver.waitForSelector({
          css: '#connectUpdate',
          text: 'Reconnect to Update Snap',
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

        // click into snap view and attempt to update the snap
        await driver.waitForSelector({
          text: 'BIP-32 Example Snap',
          tag: 'p',
        });
        await driver.clickElement({
          text: 'BIP-32 Example Snap',
          tag: 'p',
        });
        await driver.waitForSelector({
          css: '.mm-button-link',
          text: 'Update',
          tag: 'button',
        });
        await driver.clickElement({
          css: '.mm-button-link',
          text: 'Update',
          tag: 'button',
        });

        await driver.clickElementSafe('[data-testid="snap-update-scroll"]');

        await driver.clickElement({
          text: 'Update',
          tag: 'button',
        });

        await driver.waitForSelector({ text: 'OK' });

        await driver.clickElement({
          text: 'OK',
          tag: 'button',
        });

        // try to find update link again, succeed if not there
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
        await driver.waitForSelector({
          text: 'BIP-32 Example Snap',
          tag: 'p',
        });

        // click into snap view and attempt to update the snap
        await driver.clickElement({
          text: 'BIP-32 Example Snap',
          tag: 'p',
        });

        await driver.assertElementNotPresent(
          {
            css: '.mm-button-link',
            text: 'Update',
            tag: 'button',
          },
          {
            // make sure the Snap page has loaded
            findElementGuard: {
              text: 'Description from BIP-32 Example Snap',
              tag: 'p',
            },
          },
        );
      },
    );
  });
});
