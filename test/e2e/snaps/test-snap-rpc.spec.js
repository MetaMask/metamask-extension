const {
  defaultGanacheOptions,
  withFixtures,
  switchToNotificationWindow,
  unlockWallet,
} = require('../helpers');
const FixtureBuilder = require('../fixture-builder');
const { TEST_SNAPS_WEBSITE_URL } = require('./enums');

describe('Test Snap RPC', function () {
  it('can use the cross-snap RPC endowment and produce a public key', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        ganacheOptions: defaultGanacheOptions,
        title: this.test.fullTitle(),
      },
      async ({ driver }) => {
        await unlockWallet(driver);

        // navigate to test snaps page
        await driver.driver.get(TEST_SNAPS_WEBSITE_URL);

        // wait for page to load
        await driver.waitForSelector({
          text: 'Installed Snaps',
          tag: 'h2',
        });

        // find and scroll to the bip32 test and connect
        const snapButton1 = await driver.findElement('#connectbip32');
        await driver.scrollToElement(snapButton1);
        await driver.delay(1000);
        await driver.clickElement('#connectbip32');

        // switch to metamask extension and click connect
        await switchToNotificationWindow(driver, 2);
        await driver.clickElement({
          text: 'Connect',
          tag: 'button',
        });

        await driver.waitForSelector({ text: 'Install' });

        await driver.clickElementSafe('[data-testid="snap-install-scroll"]');

        await driver.clickElement({
          text: 'Install',
          tag: 'button',
        });

        // wait for permissions popover, click checkboxes and confirm
        await driver.waitForSelector('.mm-checkbox__input');
        await driver.clickElement('.mm-checkbox__input');
        await driver.clickElement({
          text: 'Confirm',
          tag: 'button',
        });

        await driver.waitForSelector({ text: 'OK' });

        await driver.clickElement({
          text: 'OK',
          tag: 'button',
        });

        // switch back to test-snaps window
        await driver.switchToWindowWithTitle('Test Snaps');

        const snapButton2 = await driver.findElement('#connectjson-rpc');
        await driver.scrollToElement(snapButton2);
        await driver.delay(1000);
        await driver.clickElement('#connectjson-rpc');

        await switchToNotificationWindow(driver, 2);
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

        await driver.switchToWindowWithTitle('Test Snaps');

        // wait for npm installation success
        await driver.waitForSelector({
          css: '#connectjson-rpc',
          text: 'Reconnect to JSON-RPC Snap',
        });

        // click send inputs on test snap page
        const snapButton3 = await driver.findElement('#sendRpc');
        await driver.scrollToElement(snapButton3);
        await driver.delay(1000);
        await driver.clickElement('#sendRpc');

        // check result with waitForSelector
        await driver.waitForSelector({
          css: '#rpcResult',
          text: '"0x033e98d696ae15caef75fa8dd204a7c5c08d1272b2218ba3c20feeb4c691eec366"',
        });
      },
    );
  });
});
