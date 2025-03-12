const {
  withFixtures,
  unlockWallet,
  WINDOW_TITLES,
  openDapp,
} = require('../helpers');
const FixtureBuilder = require('../fixture-builder');
const { TEST_SNAPS_WEBSITE_URL } = require('./enums');

describe('Test Snap TxInsights', function () {
  it('tests tx insights functionality', async function () {
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder()
          .withPermissionControllerConnectedToTestDapp()
          .build(),
        title: this.test.fullTitle(),
      },
      async ({ driver }) => {
        await unlockWallet(driver);

        // navigate to test snaps page and connect
        await driver.driver.get(TEST_SNAPS_WEBSITE_URL);

        // wait for page to load
        await driver.waitForSelector({
          text: 'Installed Snaps',
          tag: 'h2',
        });

        // find and scroll to the transaction-insights test snap
        const snapButton1 = await driver.findElement(
          '#connecttransaction-insights',
        );
        await driver.scrollToElement(snapButton1);

        // added delay for firefox (deflake)
        await driver.delayFirefox(1000);

        // wait for and click connect
        await driver.waitForSelector('#connecttransaction-insights');
        await driver.clickElement('#connecttransaction-insights');

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

        // switch to test-snaps page
        await driver.switchToWindowWithTitle(WINDOW_TITLES.TestSnaps);

        // open the test-dapp page
        await openDapp(driver);

        // switch back to test-dapp window
        await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);

        // click send tx
        const sendTransactionButton = await driver.findElement(
          '#maliciousERC20TransferButton',
        );
        await driver.scrollToElement(sendTransactionButton);
        await driver.clickElement('#maliciousERC20TransferButton');

        // delay added for rendering (deflake)
        await driver.delay(2000);

        // switch back to MetaMask window
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

        // wait for and switch to insight snap pane
        await driver.waitForSelector({
          text: 'Insights Example Snap',
          tag: 'span',
        });

        // check that txinsightstest tab contains the right info
        await driver.waitForSelector({
          css: 'p',
          text: 'ERC-20',
        });
      },
    );
  });
});
