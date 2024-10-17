const {
  defaultGanacheOptions,
  withFixtures,
  unlockWallet,
  WINDOW_TITLES,
} = require('../helpers');
const FixtureBuilder = require('../fixture-builder');
const { TEST_SNAPS_WEBSITE_URL } = require('./enums');

describe('Test Snap Get File', function () {
  it('test snap_getFile functionality', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        ganacheOptions: defaultGanacheOptions,
        title: this.test.title,
      },
      async ({ driver }) => {
        await unlockWallet(driver);

        // navigate to test snaps page and connect to get-file snap
        await driver.openNewPage(TEST_SNAPS_WEBSITE_URL);

        // wait for page to load
        await driver.waitForSelector({
          text: 'Installed Snaps',
          tag: 'h2',
        });

        // scroll to and wait for connect to get file button
        const snapButton = await driver.findElement('#connectgetfile');
        await driver.scrollToElement(snapButton);

        // added delay for firefox (deflake)
        await driver.delayFirefox(1000);

        // wait for and click connect
        await driver.waitForSelector('#connectgetfile');
        await driver.clickElement('#connectgetfile');

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
          css: '#connectgetfile',
          text: 'Reconnect to Get File Snap',
        });

        // click on get text
        await driver.clickElement('#sendGetFileTextButton');

        // check that the get text result is correct
        await driver.waitForSelector({
          css: '#getFileResult',
          text: '"foo": "bar"',
        });

        // click on get base64 and await correct result
        await driver.clickElement('#sendGetFileBase64Button');
        await driver.waitForSelector({
          css: '#getFileResult',
          text: '"ewogICJmb28iOiAiYmFyIgp9Cg=="',
        });

        // click on get text and await correct result
        await driver.clickElement('#sendGetFileHexButton');
        await driver.waitForSelector({
          css: '#getFileResult',
          text: '"0x7b0a202022666f6f223a2022626172220a7d0a"',
        });
      },
    );
  });
});
