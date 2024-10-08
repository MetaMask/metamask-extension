const {
  defaultGanacheOptions,
  withFixtures,
  unlockWallet,
  WINDOW_TITLES,
} = require('../helpers');
const FixtureBuilder = require('../fixture-builder');
const { TEST_SNAPS_WEBSITE_URL } = require('./enums');

describe('Test Snap WASM', function () {
  it('can use webassembly inside a snap', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        ganacheOptions: defaultGanacheOptions,
        title: this.test.fullTitle(),
      },
      async ({ driver }) => {
        await unlockWallet(driver);

        // navigate to test snaps page and connect to wasm snap
        await driver.openNewPage(TEST_SNAPS_WEBSITE_URL);

        // wait for page to load
        await driver.waitForSelector({
          text: 'Installed Snaps',
          tag: 'h2',
        });

        // scroll to wasm snap
        const snapButton = await driver.findElement('#connectwasm');
        await driver.scrollToElement(snapButton);

        // added delay for firefox (deflake)
        await driver.delay(1000);

        // wait for and click connect
        await driver.waitForSelector('#connectwasm');
        await driver.clickElement('#connectwasm');

        // switch to metamask extension and click connect
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
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

        // click send inputs on test snap page
        await driver.switchToWindowWithTitle(WINDOW_TITLES.TestSnaps);

        // wait for npm installation success
        await driver.waitForSelector({
          css: '#connectwasm',
          text: 'Reconnect to WebAssembly Snap',
        });

        // enter number for test to input field
        await driver.pasteIntoField('#wasmInput', '23');

        // find and click on send error
        await driver.clickElement('#sendWasmMessage');

        // wait for the correct output
        await driver.waitForSelector({
          css: '#wasmResult',
          text: '28657',
        });
      },
    );
  });
});
