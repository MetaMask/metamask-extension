const {
  defaultGanacheOptions,
  withFixtures,
  unlockWallet,
  WINDOW_TITLES,
} = require('../helpers');
const FixtureBuilder = require('../fixture-builder');
const { TEST_SNAPS_WEBSITE_URL } = require('./enums');

describe('Test Snap JSX', function () {
  it('can use JSX for snap dialog', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        ganacheOptions: defaultGanacheOptions,
        title: this.test.fullTitle(),
      },
      async ({ driver }) => {
        await unlockWallet(driver);

        // navigate to test snaps page and connect to wasm snap
        await driver.driver.get(TEST_SNAPS_WEBSITE_URL);

        // wait for page to load
        await driver.waitForSelector({
          text: 'Installed Snaps',
          tag: 'h2',
        });

        // find and scroll to the jsx test and connect
        const snapButton = await driver.findElement('#connectjsx');
        await driver.scrollToElement(snapButton);
        await driver.delay(1000);
        await driver.waitForSelector('#connectjsx');
        await driver.clickElement('#connectjsx');

        // switch to dialog window and click connect
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
        await driver.waitForSelector({
          text: 'Connect',
          tag: 'button',
        });
        await driver.clickElement({
          text: 'Connect',
          tag: 'button',
        });

        await driver.waitForSelector({ text: 'Confirm' });

        await driver.clickElementSafe('[data-testid="snap-install-scroll"]');

        await driver.clickElement({
          text: 'Confirm',
          tag: 'button',
        });

        await driver.waitForSelector({ text: 'OK' });

        await driver.clickElementAndWaitForWindowToClose({
          text: 'OK',
          tag: 'button',
        });

        // click send inputs on test snap page
        await driver.switchToWindowWithTitle(WINDOW_TITLES.TestSnaps);

        // wait for npm installation success
        await driver.waitForSelector({
          css: '#connectjsx',
          text: 'Reconnect to JSX Snap',
        });

        // click on show jsx dialog
        await driver.clickElement('#displayJsx');

        // switch to dialog window
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

        // check for count zero
        await driver.waitForSelector({
          text: '0',
          tag: 'p',
        });

        // click increment twice
        await driver.clickElement('#increment');

        // wait for count to be 1
        await driver.waitForSelector({
          text: '1',
          tag: 'p',
        });
      },
    );
  });
});
