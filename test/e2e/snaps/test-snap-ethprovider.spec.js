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

        // scroll to ethereum provider snap
        const snapButton = await driver.findElement(
          '#connectethereum-provider',
        );
        await driver.scrollToElement(snapButton);

        // added delay for firefox (deflake)
        await driver.delayFirefox(1000);

        // wait for and click connect
        await driver.waitForSelector('#connectethereum-provider');
        await driver.clickElement('#connectethereum-provider');

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

        // switch to test snap page
        await driver.switchToWindowWithTitle(WINDOW_TITLES.TestSnaps);

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

        // switch to metamask window
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
        await driver.clickElement({
          text: 'Next',
          tag: 'button',
        });

        // wait for and click confirm and wait for window to close
        await driver.waitForSelector({
          text: 'Confirm',
          tag: 'button',
        });
        await driver.clickElementAndWaitForWindowToClose({
          text: 'Confirm',
          tag: 'button',
        });

        // switch to test snap page
        await driver.switchToWindowWithTitle(WINDOW_TITLES.TestSnaps);

        // check the results of the message signature using waitForSelector
        await driver.waitForSelector({
          css: '#ethproviderResult',
          text: '"0x5cfe73b6021e818b776b421b1c4db2474086a7e1"',
        });
      },
    );
  });
});
