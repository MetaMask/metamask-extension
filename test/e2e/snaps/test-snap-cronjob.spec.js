const {
  defaultGanacheOptions,
  withFixtures,
  unlockWallet,
  WINDOW_TITLES,
  largeDelayMs,
} = require('../helpers');
const FixtureBuilder = require('../fixture-builder');
const { TEST_SNAPS_WEBSITE_URL } = require('./enums');

describe('Test Snap Cronjob', function () {
  it('can trigger a cronjob to open a dialog every minute', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        ganacheOptions: defaultGanacheOptions,
        title: this.test.fullTitle(),
      },
      async ({ driver }) => {
        await unlockWallet(driver);

        // navigate to test snaps page and connect to cronjobs snap
        await driver.openNewPage(TEST_SNAPS_WEBSITE_URL);

        // wait for page to load
        await driver.waitForSelector({
          text: 'Installed Snaps',
          tag: 'h2',
        });

        // scroll to and connect to cronjobs snap
        const snapButton = await driver.findElement('#connectcronjobs');
        await driver.scrollToElement(snapButton);

        // added delay for firefox (deflake)
        await driver.delayFirefox(1000);

        // wait for and click connect
        await driver.waitForSelector('#connectcronjobs');
        await driver.clickElement('#connectcronjobs');

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

        await driver.clickElementSafe('[data-testid="snap-install-scroll"]');

        // wait for and click confirm
        await driver.waitForSelector({ text: 'Confirm' });
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

        // click send inputs on test snap page
        await driver.switchToWindowWithTitle(WINDOW_TITLES.TestSnaps);

        // wait for npm installation success
        await driver.waitForSelector({
          css: '#connectcronjobs',
          text: 'Reconnect to Cronjobs Snap',
        });

        // Switching to dialog popup takes time, hence this wait is needed
        await driver.delay(largeDelayMs);

        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

        // look for the dialog popup to verify cronjob fired
        await driver.waitForSelector({
          css: '.snap-ui-renderer__content',
          text: 'This dialog was triggered by a cronjob',
        });

        // try to click on the Ok button and pass test if window closes
        await driver.clickElementAndWaitForWindowToClose({
          text: 'OK',
          tag: 'button',
        });
      },
    );
  });
});
