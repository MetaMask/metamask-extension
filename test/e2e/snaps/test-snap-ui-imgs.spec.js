const {
  defaultGanacheOptions,
  withFixtures,
  unlockWallet,
  switchToNotificationWindow,
  WINDOW_TITLES,
} = require('../helpers');
const FixtureBuilder = require('../fixture-builder');
const { TEST_SNAPS_WEBSITE_URL } = require('./enums');

describe('Test Snap Images', function () {
  it('can display images in snap ui', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        ganacheOptions: defaultGanacheOptions,
        title: this.test.fullTitle(),
      },
      async ({ driver }) => {
        await unlockWallet(driver);

        // navigate to test snaps page and connect
        await driver.driver.get(TEST_SNAPS_WEBSITE_URL);

        // wait for page to load
        await driver.waitForSelector({
          text: 'Installed Snaps',
          tag: 'h2',
        });

        // find and scroll to the images test and connect
        const snapButton1 = await driver.findElement('#connectimages');
        await driver.scrollToElement(snapButton1);
        await driver.delay(1000);
        await driver.waitForSelector('#connectimages');
        await driver.clickElement('#connectimages');

        // switch to metamask extension and click connect and approve
        await switchToNotificationWindow(driver, 2);
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

        // deal with OK button
        await driver.waitForSelector({ text: 'OK' });
        await driver.clickElementAndWaitForWindowToClose({
          text: 'OK',
          tag: 'button',
        });

        // switch back to test-snaps window
        await driver.switchToWindowWithTitle(WINDOW_TITLES.TestSnaps);

        // wait for npm installation success
        await driver.waitForSelector({
          css: '#connectimages',
          text: 'Reconnect to Images Snap',
        });

        // find and click svg image test
        await driver.clickElement('#showSVGImage');

        // switch to notification window
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

        // check snaps ui image using waitForSelector
        await driver.waitForSelector('[data-testid="snaps-ui-image"]');

        // click ok to close window
        await driver.clickElementAndWaitForWindowToClose(
          '[data-testid="confirmation-submit-button"]',
        );

        // switch back to test-snaps window
        await driver.switchToWindowWithTitle(WINDOW_TITLES.TestSnaps);

        // find and click png image test
        await driver.clickElement('#showPNGImage');

        // switch to notification window
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

        // check snaps ui image using waitForSelector
        await driver.waitForSelector('[data-testid="snaps-ui-image"]');
      },
    );
  });
});
