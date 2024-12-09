const {
  defaultGanacheOptions,
  withFixtures,
  WINDOW_TITLES,
  unlockWallet,
} = require('../helpers');
const FixtureBuilder = require('../fixture-builder');
const { TEST_SNAPS_WEBSITE_URL } = require('./enums');

describe('Test Snap revoke permission', function () {
  it('can revoke a permission', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        ganacheOptions: defaultGanacheOptions,
        title: this.test.fullTitle(),
      },
      async ({ driver }) => {
        await unlockWallet(driver);

        // navigate to test snaps page and connect to ethereum-provider snap
        await driver.openNewPage(TEST_SNAPS_WEBSITE_URL);

        // wait for page to load
        await driver.waitForSelector({
          text: 'Installed Snaps',
          tag: 'h2',
        });

        // scroll to ethereum-provider snap
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

        // wait for and click connect
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
        const snapButton3 = await driver.findElement(
          '#sendEthproviderAccounts',
        );
        await driver.scrollToElement(snapButton3);

        // added delay for firefox (deflake)
        await driver.delayFirefox(1000);

        // wait for and click send
        await driver.waitForSelector('#sendEthproviderAccounts');
        await driver.clickElement('#sendEthproviderAccounts');

        // switch to metamask window
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

        // wait for and click next
        await driver.waitForSelector({
          text: 'Next',
          tag: 'button',
        });
        await driver.clickElement({
          text: 'Next',
          tag: 'button',
        });

        // delay added for rendering time (deflake)
        await driver.delay(500);

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

        // switch to the original MM tab
        await driver.switchToWindowWithTitle(
          WINDOW_TITLES.ExtensionInFullScreenView,
        );

        // added delay for rendering (deflake)
        await driver.delay(1000);

        // click on the global action menu
        await driver.clickElement(
          '[data-testid="account-options-menu-button"]',
        );

        // try to click on the snaps item
        await driver.clickElement({
          text: 'Snaps',
          tag: 'div',
        });

        // try to click on the Ethereum Provider Example Snap
        await driver.clickElement({
          text: 'Ethereum Provider Example Snap',
          tag: 'p',
        });

        // try to click on options menu
        await driver.clickElement('[data-testid="endowment:caip25"]');

        // try to click on revoke permission
        await driver.clickElement({
          text: 'Revoke permission',
          tag: 'p',
        });

        // switch to test snap page
        await driver.switchToWindowWithTitle(WINDOW_TITLES.TestSnaps);

        // find and click on send get version
        const snapButton4 = await driver.findElement(
          '#sendEthproviderAccounts',
        );
        await driver.scrollToElement(snapButton4);

        // added delay for firefox (deflake)
        await driver.delayFirefox(1000);

        // wait for and click connect
        await driver.waitForSelector('#sendEthproviderAccounts');
        await driver.clickElement('#sendEthproviderAccounts');

        // delay added for rendering time (deflake)
        await driver.delay(500);

        // switch to metamask dialog
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

        // wait for and click next
        await driver.waitForSelector({
          text: 'Next',
          tag: 'button',
        });
        await driver.clickElement({
          text: 'Next',
          tag: 'button',
        });

        // delay added for rendering time (deflake)
        await driver.delay(500);

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
