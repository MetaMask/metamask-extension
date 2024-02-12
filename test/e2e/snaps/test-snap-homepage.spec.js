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

        // find and scroll to the honmepage test and connect
        const snapButton1 = await driver.findElement('#connecthomepage');
        await driver.scrollToElement(snapButton1);
        await driver.delay(1000);
        await driver.clickElement('#connecthomepage');

        // switch to metamask extension and click connect
        const windowHandles = await driver.waitUntilXWindowHandles(
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

        // switch to metamask page and open the three dots menu
        await driver.switchToWindowWithTitle(
          WINDOW_TITLES.ExtensionInFullScreenView,
          windowHandles,
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
          text: 'Content from Home Page Example Snap',
          tag: 'p',
        });
        await driver.waitForSelector({
          text: 'Welcome to my Snap home page!',
          tag: 'p',
        });
      },
    );
  });
});
