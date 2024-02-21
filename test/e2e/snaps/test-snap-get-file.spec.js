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

        const dialogButton = await driver.findElement('#connectgetfile');
        await driver.scrollToElement(dialogButton);
        await driver.delay(1000);
        await driver.clickElement('#connectgetfile');

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

        // switch to test snaps tab
        await driver.switchToWindowWithTitle('Test Snaps', windowHandles);

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
