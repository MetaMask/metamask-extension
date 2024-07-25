const {
  defaultGanacheOptions,
  withFixtures,
  unlockWallet,
  switchToNotificationWindow,
  WINDOW_TITLES,
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

        const snapButton = await driver.findElement('#connectcronjobs');
        await driver.scrollToElement(snapButton);
        await driver.delay(500);
        await driver.clickElement('#connectcronjobs');

        // switch to metamask extension and click connect
        await switchToNotificationWindow(driver);
        await driver.clickElement({
          text: 'Connect',
          tag: 'button',
        });

        await driver.waitForSelector({ text: 'Confirm' });

        await driver.clickElement({
          text: 'Confirm',
          tag: 'button',
        });

        await driver.waitForSelector({ text: 'OK' });

        await driver.clickElement({
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

        // switch to dialog popup, wait for a maximum of 65 seconds
        await switchToNotificationWindow(driver);

        // look for the dialog popup to verify cronjob fired
        await driver.waitForSelector({
          css: '.snap-ui-renderer__content',
          text: 'This dialog was triggered by a cronjob',
        });

        // try to click on the Ok button and pass test if it works
        await driver.clickElement({
          text: 'OK',
          tag: 'button',
        });
      },
    );
  });
});
