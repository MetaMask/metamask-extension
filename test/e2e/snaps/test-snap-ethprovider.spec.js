const {
  defaultGanacheOptions,
  withFixtures,
  unlockWallet,
  WINDOW_TITLES,
} = require('../helpers');
const FixtureBuilder = require('../fixture-builder');
const { TEST_SNAPS_WEBSITE_URL } = require('./enums');

describe('Test Snap ethereum_provider', function () {
  it('can use the ethereum_provider endowment', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        ganacheOptions: defaultGanacheOptions,
        title: this.test.fullTitle(),
      },
      async ({ driver }) => {
        await unlockWallet(driver);

        // navigate to test snaps page and connect to ethereum-provider snap
        await driver.driver.get(TEST_SNAPS_WEBSITE_URL);

        // wait for page to load
        await driver.waitForSelector({
          text: 'Installed Snaps',
          tag: 'h2',
        });

        const snapButton = await driver.findElement(
          '#connectethereum-provider',
        );
        await driver.scrollToElement(snapButton);
        await driver.delay(1000);
        await driver.clickElement('#connectethereum-provider');

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

        // switch to test snap page
        await driver.switchToWindowWithTitle('Test Snaps', windowHandles);

        // wait for npm installation success
        await driver.waitForSelector({
          css: '#connectethereum-provider',
          text: 'Reconnect to Ethereum Provider Snap',
        });

        // find and click on send get version
        const snapButton2 = await driver.findElement('#sendEthprovider');
        await driver.scrollToElement(snapButton2);
        await driver.delay(500);
        await driver.clickElement('#sendEthprovider');

        // check the results of the message signature using waitForSelector
        await driver.waitForSelector({
          css: '#ethproviderResult',
          text: '"1337"',
        });

        // find and click on send get version
        const snapButton3 = await driver.findElement(
          '#sendEthproviderAccounts',
        );
        await driver.scrollToElement(snapButton3);
        await driver.delay(500);
        await driver.clickElement('#sendEthproviderAccounts');

        // switch to metamask window and click through confirmations
        const windowHandles2 = await driver.waitUntilXWindowHandles(
          2,
          1000,
          10000,
        );
        await driver.switchToWindowWithTitle(
          WINDOW_TITLES.Dialog,
          windowHandles2,
        );
        await driver.clickElement({
          text: 'Next',
          tag: 'button',
        });
        await driver.waitForSelector({
          text: 'Connect',
          tag: 'button',
        });
        await driver.clickElement({
          text: 'Connect',
          tag: 'button',
        });

        // switch to test snap page
        await driver.switchToWindowWithTitle('Test Snaps', windowHandles);

        // check the results of the message signature using waitForSelector
        await driver.waitForSelector({
          css: '#ethproviderResult',
          text: '"0x5cfe73b6021e818b776b421b1c4db2474086a7e1"',
        });
      },
    );
  });
});
