const {
  defaultGanacheOptions,
  withFixtures,
  unlockWallet,
  WINDOW_TITLES,
} = require('../helpers');
const FixtureBuilder = require('../fixture-builder');
const { TEST_SNAPS_WEBSITE_URL } = require('./enums');

describe('Test Snap TxInsights', function () {
  it('tests tx insights functionality', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        ganacheOptions: defaultGanacheOptions,
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

        // find and scroll to the transaction-insights test and connect
        const snapButton1 = await driver.findElement(
          '#connecttransaction-insights',
        );
        await driver.scrollToElement(snapButton1);
        await driver.delay(1000);
        await driver.clickElement('#connecttransaction-insights');

        // switch to metamask extension and click connect
        let windowHandles = await driver.waitUntilXWindowHandles(
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

        // switch to test-snaps page and get accounts
        await driver.switchToWindowWithTitle('Test Snaps', windowHandles);
        await driver.clickElement('#getAccounts');

        // switch back to MetaMask window and deal with dialogs
        windowHandles = await driver.waitUntilXWindowHandles(2, 1000, 10000);
        await driver.switchToWindowWithTitle(
          WINDOW_TITLES.Dialog,
          windowHandles,
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

        // switch to test-snaps page and send tx
        windowHandles = await driver.waitUntilXWindowHandles(1, 1000, 10000);
        await driver.switchToWindowWithTitle('Test Snaps', windowHandles);
        await driver.clickElement('#sendInsights');

        // switch back to MetaMask window and switch to tx insights pane
        windowHandles = await driver.waitUntilXWindowHandles(2, 1000, 10000);
        await driver.switchToWindowWithTitle(
          WINDOW_TITLES.Dialog,
          windowHandles,
        );
        await driver.waitForSelector({
          text: 'Insights Example Snap',
          tag: 'button',
        });
        await driver.clickElement({
          text: 'Insights Example Snap',
          tag: 'button',
        });

        // check that txinsightstest tab contains the right info
        await driver.waitForSelector({
          css: '.snap-ui-renderer__content',
          text: 'ERC-20',
        });
      },
    );
  });
});
