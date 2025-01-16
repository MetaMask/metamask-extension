const {
  defaultGanacheOptions,
  withFixtures,
  unlockWallet,
  WINDOW_TITLES,
} = require('../helpers');
const FixtureBuilder = require('../fixture-builder');
const { TEST_SNAPS_WEBSITE_URL } = require('./enums');

describe('Test Snap manageState', function () {
  it('can use the new state API', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        ganacheOptions: defaultGanacheOptions,
        title: this.test.fullTitle(),
      },
      async ({ driver }) => {
        await unlockWallet(driver);

        // navigate to test snaps page, then fill in the snapId
        await driver.driver.get(TEST_SNAPS_WEBSITE_URL);

        // wait for page to load
        await driver.waitForSelector({
          text: 'Installed Snaps',
          tag: 'h2',
        });

        // scroll to manage-state snap
        const snapButton1 = await driver.findElement('#connectstate');
        await driver.scrollToElement(snapButton1);

        // added delay for firefox (deflake)
        await driver.delayFirefox(1000);

        // wait for and click connect
        await driver.waitForSelector('#connectstate');
        await driver.clickElement('#connectstate');

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

        // fill and click send inputs on test snap page
        await driver.switchToWindowWithTitle(WINDOW_TITLES.TestSnaps);

        // wait for npm installation success
        await driver.waitForSelector({
          css: '#connectstate',
          text: 'Reconnect to State Snap',
        });

        // Enter data and click set
        const sendEncrypted = await driver.findElement('#setStateKey');
        await driver.scrollToElement(sendEncrypted);
        await driver.delayFirefox(1000);
        await driver.pasteIntoField('#setStateKey', 'foo');
        await driver.pasteIntoField('#dataState', '"bar"');
        await driver.clickElement('#sendState');

        // Check that the entire state blob was updated
        await driver.waitForSelector({
          css: '#encryptedStateResult',
          text: JSON.stringify({ foo: 'bar' }, null, 2),
        });

        // Check that we can retrieve one state key
        const getKeyField = await driver.findElement('#getState');
        await driver.scrollToElement(getKeyField);
        await driver.delayFirefox(1000);
        await driver.pasteIntoField('#getState', 'foo');
        await driver.clickElement('#sendGetState');

        await driver.waitForSelector({
          css: '#getStateResult',
          text: '"bar"',
        });

        // click clear results
        await driver.clickElement('#clearState');

        // check result array is empty
        await driver.waitForSelector({
          css: '#encryptedStateResult',
          text: 'null',
        });

        // repeat the same above steps to check unencrypted state management

        // Enter data and click set
        const sendUnencrypted = await driver.findElement(
          '#setStateKeyUnencrypted',
        );
        await driver.scrollToElement(sendUnencrypted);
        await driver.delayFirefox(1000);
        await driver.pasteIntoField('#setStateKeyUnencrypted', 'foo');
        await driver.pasteIntoField('#dataUnencryptedState', '"bar"');
        await driver.clickElement('#sendUnencryptedState');

        // Check that the entire state blob was updated
        await driver.waitForSelector({
          css: '#unencryptedStateResult',
          text: JSON.stringify({ foo: 'bar' }, null, 2),
        });

        // Check that we can retrive one state key
        const getUnencryptedKeyField = await driver.findElement(
          '#getUnencryptedState',
        );
        await driver.scrollToElement(getUnencryptedKeyField);
        await driver.delayFirefox(1000);
        await driver.pasteIntoField('#getUnencryptedState', 'foo');
        await driver.clickElement('#sendGetUnencryptedState');

        await driver.waitForSelector({
          css: '#getStateUnencryptedResult',
          text: '"bar"',
        });

        // click clear results
        await driver.clickElement('#clearStateUnencrypted');

        // check result array is empty
        await driver.waitForSelector({
          css: '#unencryptedStateResult',
          text: 'null',
        });
      },
    );
  });

  it('can use the legacy state API', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        ganacheOptions: defaultGanacheOptions,
        title: this.test.fullTitle(),
      },
      async ({ driver }) => {
        await unlockWallet(driver);

        // navigate to test snaps page, then fill in the snapId
        await driver.driver.get(TEST_SNAPS_WEBSITE_URL);

        // wait for page to load
        await driver.waitForSelector({
          text: 'Installed Snaps',
          tag: 'h2',
        });

        // scroll to manage-state snap
        const snapButton1 = await driver.findElement('#connectmanage-state');
        await driver.scrollToElement(snapButton1);

        // added delay for firefox (deflake)
        await driver.delayFirefox(1000);

        // wait for and click connect
        await driver.waitForSelector('#connectmanage-state');
        await driver.clickElement('#connectmanage-state');

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

        // fill and click send inputs on test snap page
        await driver.switchToWindowWithTitle(WINDOW_TITLES.TestSnaps);

        // wait for npm installation success
        await driver.waitForSelector({
          css: '#connectmanage-state',
          text: 'Reconnect to Legacy State Snap',
        });

        // enter data and click send managestate
        await driver.pasteIntoField('#dataManageState', '23');
        const snapButton2 = await driver.findElement(
          '#retrieveManageStateResult',
        );
        await driver.scrollToElement(snapButton2);
        await driver.clickElement('#sendManageState');

        // check the results of the public key test
        await driver.waitForSelector({
          css: '#sendManageStateResult',
          text: 'true',
        });

        // check the results
        await driver.waitForSelector({
          css: '#retrieveManageStateResult',
          text: '"23"',
        });

        // click clear results
        await driver.clickElement('#clearManageState');

        // check if true
        await driver.waitForSelector({
          css: '#clearManageStateResult',
          text: 'true',
        });

        // check result array is empty
        await driver.waitForSelector({
          css: '#retrieveManageStateResult',
          text: '[]',
        });

        // repeat the same above steps to check unencrypted state management
        // enter data and send
        await driver.pasteIntoField('#dataUnencryptedManageState', '23');
        const snapButton3 = await driver.findElement('#clearManageState');
        await driver.scrollToElement(snapButton3);
        await driver.delay(1000);
        await driver.clickElement('#sendUnencryptedManageState');

        // check the results of the public key test
        await driver.waitForSelector({
          css: '#sendUnencryptedManageStateResult',
          text: 'true',
        });

        // check the results
        await driver.waitForSelector({
          css: '#retrieveManageStateUnencryptedResult',
          text: '"23"',
        });

        // click clear results
        await driver.clickElement('#clearUnencryptedManageState');

        // check if true
        await driver.waitForSelector({
          css: '#clearUnencryptedManageStateResult',
          text: 'true',
        });

        // check result array is empty
        await driver.waitForSelector({
          css: '#retrieveManageStateUnencryptedResult',
          text: '[]',
        });
      },
    );
  });
});
