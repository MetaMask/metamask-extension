const {
  defaultGanacheOptions,
  withFixtures,
  unlockWallet,
  WINDOW_TITLES,
} = require('../helpers');
const FixtureBuilder = require('../fixture-builder');
const { TEST_SNAPS_WEBSITE_URL } = require('./enums');

describe('Test Snap Get Locale', function () {
  it('test snap_getLocale functionality', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        ganacheOptions: defaultGanacheOptions,
        title: this.test.fullTitle(),
      },
      async ({ driver }) => {
        await unlockWallet(driver);

        // navigate to test snaps page and connect to get-locale snap
        await driver.openNewPage(TEST_SNAPS_WEBSITE_URL);

        // wait for page to load
        await driver.waitForSelector({
          text: 'Installed Snaps',
          tag: 'h2',
        });

        // scroll to dialog snap
        const dialogButton = await driver.findElement('#connectgetlocale');
        await driver.scrollToElement(dialogButton);

        // added delay for firefox (deflake)
        await driver.delayFirefox(1000);

        // wait for and click connect
        await driver.waitForSelector('#connectgetlocale');
        await driver.clickElement('#connectgetlocale');

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

        // look for the snap name
        await driver.waitForSelector({
          text: 'Localization Example Snap',
          tag: 'p',
        });

        // wait for confirm
        await driver.waitForSelector({ text: 'Confirm' });

        // click and dismiss possible scroll element
        await driver.clickElementSafe('[data-testid="snap-install-scroll"]');

        // click confirm
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

        // switch to test snaps tab
        await driver.switchToWindowWithTitle(WINDOW_TITLES.TestSnaps);

        // wait for npm installation success
        await driver.waitForSelector({
          css: '#connectgetlocale',
          text: 'Reconnect to Localization Snap',
        });

        // click on alert dialog
        await driver.clickElement('#sendGetLocaleHelloButton');

        // check for result correctness
        await driver.waitForSelector({
          css: '#getLocaleResult',
          text: '"Hello, world!"',
        });

        // try switching language to dansk
        //
        // switch to the original MM tab
        await driver.switchToWindowWithTitle(
          WINDOW_TITLES.ExtensionInFullScreenView,
        );

        // click on the global action menu
        await driver.clickElement(
          '[data-testid="account-options-menu-button"]',
        );

        // try to click on the notification item
        await driver.clickElement({ text: 'Settings', tag: 'div' });

        // try to click on the snaps item
        await driver.waitForSelector({
          text: 'General',
          tag: 'div',
        });
        await driver.clickElement({
          text: 'General',
          tag: 'div',
        });

        // try to click on locale-select
        await driver.waitForSelector('[data-testid="locale-select"]');
        await driver.clickElement('[data-testid="locale-select"]');

        // try to select dansk from the list
        await driver.clickElement({ text: 'Dansk', tag: 'option' });

        // there are 2 re-renders which cause flakiness (issue #25651)
        // the delay can be removed once the issue is fixed in the app level
        await driver.delay(1000);
        await driver.assertElementNotPresent('.loading-overlay');

        // click on the global action menu
        await driver.clickElement(
          '[data-testid="account-options-menu-button"]',
        );

        // try to click on snaps
        await driver.clickElement({ text: 'Snaps', tag: 'div' });

        // check for localized snap title
        await driver.waitForSelector({ text: 'Oversættelses Eksempel Snap' });

        // switch back to test snaps tab
        await driver.switchToWindowWithTitle(WINDOW_TITLES.TestSnaps);

        // click on alert dialog
        await driver.clickElement('#sendGetLocaleHelloButton');

        // check for result correctness
        await driver.waitForSelector({
          css: '#getLocaleResult',
          text: '"Hej, verden!"',
        });
      },
    );
  });
});
