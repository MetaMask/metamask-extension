const {
  defaultGanacheOptions,
  withFixtures,
  unlockWallet,
  WINDOW_TITLES,
} = require('../helpers');
const FixtureBuilder = require('../fixture-builder');
const { TEST_SNAPS_WEBSITE_URL } = require('./enums');

describe('Test Snap Homepage', function () {
  it('tests snap home page functionality', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        ganacheOptions: defaultGanacheOptions,
        title: this.test.fullTitle(),
      },
      async ({ driver }) => {
        await unlockWallet(driver);

        // navigate to test snaps page and connect
        await driver.openNewPage(TEST_SNAPS_WEBSITE_URL);

        // wait for page to load
        await driver.waitForSelector({
          text: 'Installed Snaps',
          tag: 'h2',
        });

        // find and scroll to the homepage snap
        const snapButton1 = await driver.findElement('#connecthomepage');
        await driver.scrollToElement(snapButton1);

        // added delay for firefox (deflake)
        await driver.delayFirefox(1000);

        // wait for and click connect
        await driver.waitForSelector('#connecthomepage');
        await driver.clickElement('#connecthomepage');

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

        // wait for and click confirm
        await driver.waitForSelector({ text: 'Confirm' });
        await driver.clickElement({
          text: 'Confirm',
          tag: 'button',
        });

        // wait for and click ok and wait for windows to close
        await driver.waitForSelector({ text: 'OK' });
        await driver.clickElementAndWaitForWindowToClose({
          text: 'OK',
          tag: 'button',
        });

        // switch to metamask page and open the three dots menu
        await driver.switchToWindowWithTitle(
          WINDOW_TITLES.ExtensionInFullScreenView,
        );
        await driver.clickElement(
          '[data-testid="account-options-menu-button"]',
        );

        // wait for the snaps menu item
        await driver.waitForSelector({
          text: 'Snaps',
          tag: 'div',
        });

        // try to click on the snaps item
        await driver.clickElement({
          text: 'Snaps',
          tag: 'div',
        });

        // wait for the snap to be clickable
        await driver.waitForSelector({
          text: 'Home Page Example Snap',
          tag: 'p',
        });

        // try to click the snap
        await driver.clickElement({
          text: 'Home Page Example Snap',
          tag: 'p',
        });

        // check that the home page appears and contains the right info
        await driver.waitForSelector({
          text: 'Welcome to my Snap home page!',
          tag: 'p',
        });
      },
    );
  });
});
