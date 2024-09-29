const {
  defaultGanacheOptions,
  withFixtures,
  unlockWallet,
  WINDOW_TITLES,
} = require('../helpers');
const FixtureBuilder = require('../fixture-builder');
const { TEST_SNAPS_WEBSITE_URL } = require('./enums');

describe('Test Snap Dialog', function () {
  it('test all four snap_dialog types', async function () {
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
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
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

        await driver.clickElementAndWaitForWindowToClose({
          text: 'OK',
          tag: 'button',
        });

        // switch to test snaps tab
        await driver.switchToWindowWithTitle(WINDOW_TITLES.TestSnaps);

        // wait for npm installation success
        await driver.waitForSelector({
          css: '#connectdialogs',
          text: 'Reconnect to Dialogs Snap',
        });

        // test 1 - alert dialog
        // click on alert dialog
        await driver.clickElement('#sendAlertButton');

        // switch to dialog popup
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

        // check dialog contents
        const result = await driver.findElement('.snap-ui-renderer__panel');
        await driver.scrollToElement(result);
        await driver.waitForSelector({
          css: '.snap-ui-renderer__panel',
          text: 'It has a single button: "OK"',
        });

        // click ok button
        await driver.clickElementAndWaitForWindowToClose({
          text: 'OK',
          tag: 'button',
        });

        // switch back to test snaps tab
        await driver.switchToWindowWithTitle(WINDOW_TITLES.TestSnaps);

        // check result is null
        await driver.waitForSelector({
          css: '#dialogResult',
          text: 'null',
        });

        // test 2 - confirmation dialog
        // click conf button
        await driver.clickElement('#sendConfirmationButton');

        // switch to dialog popup
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

        // click reject
        await driver.clickElementAndWaitForWindowToClose({
          text: 'Reject',
          tag: 'button',
        });

        // switch back to test snaps tab
        await driver.switchToWindowWithTitle(WINDOW_TITLES.TestSnaps);

        // check for false result
        await driver.waitForSelector({
          css: '#dialogResult',
          text: 'false',
        });

        // click conf button again
        await driver.clickElement('#sendConfirmationButton');

        // switch to dialog popup
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

        // click accept
        await driver.clickElementAndWaitForWindowToClose({
          text: 'Approve',
          tag: 'button',
        });

        // switch back to test snaps tab
        await driver.switchToWindowWithTitle(WINDOW_TITLES.TestSnaps);

        // check for true result
        await driver.waitForSelector({
          css: '#dialogResult',
          text: 'true',
        });

        // test 3 - prompt dialog
        // click prompt button
        await driver.clickElement('#sendPromptButton');

        // switch to dialog popup
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

        // click cancel button
        await driver.clickElementAndWaitForWindowToClose({
          text: 'Cancel',
          tag: 'button',
        });

        // switch back to test snaps tab
        await driver.switchToWindowWithTitle(WINDOW_TITLES.TestSnaps);

        // check result is equal to 'null'
        await driver.waitForSelector({
          css: '#dialogResult',
          text: 'null',
        });

        // click prompt button
        await driver.clickElement('#sendPromptButton');

        // switch to dialog popup
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

        // fill '2323' in form field
        await driver.pasteIntoField('.mm-input', '2323');

        // click submit button
        await driver.clickElementAndWaitForWindowToClose({
          text: 'Submit',
          tag: 'button',
        });

        // switch back to test snaps tab
        await driver.switchToWindowWithTitle(WINDOW_TITLES.TestSnaps);

        // check result is equal to '2323'
        await driver.waitForSelector({
          css: '#dialogResult',
          text: '"2323"',
        });

        // test 4 - custom dialog
        // click custom button
        await driver.clickElement('#sendCustomButton');

        // switch to dialog popup
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

        // click cancel button
        await driver.clickElementAndWaitForWindowToClose({
          text: 'Cancel',
          tag: 'span',
        });

        // switch back to test snaps tab
        await driver.switchToWindowWithTitle(WINDOW_TITLES.TestSnaps);

        // check result is equal to 'null'
        await driver.waitForSelector({
          css: '#dialogResult',
          text: 'null',
        });

        // click prompt button
        await driver.clickElement('#sendCustomButton');

        // switch to dialog popup
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

        // fill '2323' in form field
        await driver.pasteIntoField('#custom-input', '2323');

        // click confirm button
        await driver.clickElementAndWaitForWindowToClose({
          text: 'Confirm',
          tag: 'span',
        });

        // switch back to test snaps tab
        await driver.switchToWindowWithTitle(WINDOW_TITLES.TestSnaps);

        // check result is equal to '2323'
        await driver.waitForSelector({
          css: '#dialogResult',
          text: '"2323"',
        });
      },
    );
  });
});
