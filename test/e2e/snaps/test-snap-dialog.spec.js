const {
  defaultGanacheOptions,
  withFixtures,
  unlockWallet,
  WINDOW_TITLES,
} = require('../helpers');
const FixtureBuilder = require('../fixture-builder');
const { TEST_SNAPS_WEBSITE_URL } = require('./enums');

describe('Test Snap Dialog', function () {
  it('test all three snap_dialog types', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        ganacheOptions: defaultGanacheOptions,
        title: this.test.fullTitle(),
      },
      async ({ driver }) => {
        await unlockWallet(driver);

        // navigate to test snaps page and connect to dialog snap
        await driver.openNewPage(TEST_SNAPS_WEBSITE_URL);

        // wait for page to load
        await driver.waitForSelector({
          text: 'Installed Snaps',
          tag: 'h2',
        });

        const dialogButton = await driver.findElement('#connectdialogs');
        await driver.scrollToElement(dialogButton);
        await driver.delay(500);
        await driver.clickElement('#connectdialogs');

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
          css: '#connectdialogs',
          text: 'Reconnect to Dialogs Snap',
        });

        // click on alert dialog
        await driver.clickElement('#sendAlertButton');

        // switch to dialog popup
        windowHandles = await driver.waitUntilXWindowHandles(3, 1000, 10000);
        await driver.switchToWindowWithTitle(
          WINDOW_TITLES.Dialog,
          windowHandles,
        );

        // check dialog contents
        const result = await driver.findElement('.snap-ui-renderer__panel');
        await driver.scrollToElement(result);
        await driver.waitForSelector({
          css: '.snap-ui-renderer__panel',
          text: 'It has a single button: "OK"',
        });

        // click ok button
        await driver.clickElement({
          text: 'OK',
          tag: 'button',
        });

        // switch back to test snaps tab
        windowHandles = await driver.waitUntilXWindowHandles(2, 1000, 10000);
        await driver.switchToWindowWithTitle('Test Snaps', windowHandles);

        // check result is null
        await driver.waitForSelector({
          css: '#dialogResult',
          text: 'null',
        });

        // click conf button
        await driver.clickElement('#sendConfirmationButton');

        // switch to dialog popup
        windowHandles = await driver.waitUntilXWindowHandles(3, 1000, 10000);
        await driver.switchToWindowWithTitle(
          WINDOW_TITLES.Dialog,
          windowHandles,
        );

        // click reject
        await driver.clickElement({
          text: 'Reject',
          tag: 'button',
        });

        // switch back to test snaps tab
        windowHandles = await driver.waitUntilXWindowHandles(2, 1000, 10000);
        await driver.switchToWindowWithTitle('Test Snaps', windowHandles);

        // check for false result
        await driver.waitForSelector({
          css: '#dialogResult',
          text: 'false',
        });

        // click conf button again
        await driver.clickElement('#sendConfirmationButton');

        // switch to dialog popup
        windowHandles = await driver.waitUntilXWindowHandles(3, 1000, 10000);
        await driver.switchToWindowWithTitle(
          WINDOW_TITLES.Dialog,
          windowHandles,
        );

        // click accept
        await driver.clickElement({
          text: 'Approve',
          tag: 'button',
        });

        // switch back to test snaps tab
        windowHandles = await driver.waitUntilXWindowHandles(2, 1000, 10000);
        await driver.switchToWindowWithTitle('Test Snaps', windowHandles);

        // check for true result
        await driver.waitForSelector({
          css: '#dialogResult',
          text: 'true',
        });

        // click prompt button
        await driver.clickElement('#sendPromptButton');

        // switch to dialog popup
        windowHandles = await driver.waitUntilXWindowHandles(3, 1000, 10000);
        await driver.switchToWindowWithTitle(
          WINDOW_TITLES.Dialog,
          windowHandles,
        );

        // click cancel button
        await driver.clickElement({
          text: 'Cancel',
          tag: 'button',
        });

        // switch back to test snaps tab
        windowHandles = await driver.waitUntilXWindowHandles(2, 1000, 10000);
        await driver.switchToWindowWithTitle('Test Snaps', windowHandles);

        // check result is equal to 'null'
        await driver.waitForSelector({
          css: '#dialogResult',
          text: 'null',
        });

        // click prompt button
        await driver.clickElement('#sendPromptButton');

        // switch to dialog popup
        windowHandles = await driver.waitUntilXWindowHandles(3, 1000, 10000);
        await driver.switchToWindowWithTitle(
          WINDOW_TITLES.Dialog,
          windowHandles,
        );

        // fill '2323' in form field
        await driver.pasteIntoField('.mm-input', '2323');

        // click submit button
        await driver.clickElement({
          text: 'Submit',
          tag: 'button',
        });

        // switch back to test snaps tab
        windowHandles = await driver.waitUntilXWindowHandles(2, 1000, 10000);
        await driver.switchToWindowWithTitle('Test Snaps', windowHandles);

        // check result is equal to '2323'
        await driver.waitForSelector({
          css: '#dialogResult',
          text: '"2323"',
        });
      },
    );
  });
});
