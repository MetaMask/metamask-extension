const {
  defaultGanacheOptions,
  withFixtures,
  unlockWallet,
  WINDOW_TITLES,
} = require('../helpers');
const FixtureBuilder = require('../fixture-builder');
const { TEST_SNAPS_WEBSITE_URL } = require('./enums');

describe('Test Snap manageState', function () {
  it('can pop up manageState snap and do update get and clear', async function () {
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

        // navigate to test snaps page and connect to manage-state snap
        const snapButton1 = await driver.findElement('#connectmanage-state');
        await driver.scrollToElement(snapButton1);
        await driver.delay(1000);
        await driver.clickElement('#connectmanage-state');

        // switch to metamask extension and click connect
        const windowHandles = await driver.waitUntilXWindowHandles(
          2,
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

        // fill and click send inputs on test snap page
        await driver.switchToWindowWithTitle('Test Snaps', windowHandles);

        // wait for npm installation success
        await driver.waitForSelector({
          css: '#connectmanage-state',
          text: 'Reconnect to Manage State Snap',
        });

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
