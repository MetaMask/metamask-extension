const {
  defaultGanacheOptions,
  withFixtures,
  unlockWallet,
  WINDOW_TITLES,
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

        // find and scroll to the bip32 test snap
        const snapButton1 = await driver.findElement('#connectbip32');
        await driver.scrollToElement(snapButton1);

        // added delay for firefox (deflake)
        await driver.delay(1000);

        // wait for and click connect
        await driver.waitForSelector('#connectbip32');
        await driver.clickElement('#connectbip32');

        // switch to metamask extension and click connect
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
        await driver.clickElement({
          text: 'Connect',
          tag: 'button',
        });

        // wait for confirm button
        await driver.waitForSelector({ text: 'Confirm' });

        // click and dismiss possible scroll element
        await driver.clickElementSafe('[data-testid="snap-install-scroll"]');

        // click confirm
        await driver.clickElement({
          text: 'Confirm',
          tag: 'button',
        });

        // wait for permissions popover, click checkboxes and confirm
        await driver.waitForSelector('.mm-checkbox__input');
        await driver.clickElement('.mm-checkbox__input');
        await driver.waitForSelector(
          '[data-testid="snap-install-warning-modal-confirm"]',
        );
        await driver.clickElement(
          '[data-testid="snap-install-warning-modal-confirm"]',
        );

        // wait for and click ok
        await driver.waitForSelector({ text: 'OK' });
        await driver.clickElement({
          text: 'OK',
          tag: 'button',
        });

        // switch back to test-snaps window
        await driver.switchToWindowWithTitle(WINDOW_TITLES.TestSnaps);

        // scroll to json-rpc snap
        const snapButton2 = await driver.findElement('#connectjson-rpc');
        await driver.scrollToElement(snapButton2);

        // added delay for firefox (deflake)
        await driver.delay(1000);

        // wait for and click connect
        await driver.waitForSelector('#connectjson-rpc');
        await driver.clickElement('#connectjson-rpc');

        // switch to metamask dialog
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

        // wait for and click ok
        await driver.waitForSelector({ text: 'OK' });
        await driver.clickElement({
          text: 'OK',
          tag: 'button',
        });

        // switch to test snaps window
        await driver.switchToWindowWithTitle(WINDOW_TITLES.TestSnaps);

        // wait for npm installation success
        await driver.waitForSelector({
          css: '#connectjson-rpc',
          text: 'Reconnect to JSON-RPC Snap',
        });

        // scroll to send rpc
        const snapButton3 = await driver.findElement('#sendRpc');
        await driver.scrollToElement(snapButton3);

        // added delay for firefox (deflake)
        await driver.delay(1000);

        // wait for and click send
        await driver.waitForSelector('#sendRpc');
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
