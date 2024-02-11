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

        const dialogButton = await driver.findElement('#connectgetlocale');
        await driver.scrollToElement(dialogButton);
        await driver.delay(1000);
        await driver.clickElement('#connectgetlocale');

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

        await driver.clickElementSafe('[data-testid="snap-install-scroll"]');

        await driver.clickElement({
          text: 'Install',
          tag: 'button',
        });

        await driver.waitForSelector({ text: 'OK' });

        await driver.clickElement({
          text: 'OK',
          tag: 'button',
        });

        // switch to test snaps tab
        await driver.switchToWindowWithTitle('Test Snaps', windowHandles);

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
        const extensionPage = windowHandles[0];
        await driver.switchToWindow(extensionPage);

        // click on the global action menu
        await driver.waitForSelector(
          '[data-testid="account-options-menu-button"]',
        );
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

        // switch back to test snaps tab
        windowHandles = await driver.waitUntilXWindowHandles(2, 1000, 10000);
        await driver.switchToWindowWithTitle('Test Snaps', windowHandles);

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
