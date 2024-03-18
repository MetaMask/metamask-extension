const {
  withFixtures,
  defaultGanacheOptions,
  unlockWallet,
  WINDOW_TITLES,
} = require('../helpers');
const FixtureBuilder = require('../fixture-builder');
const { TEST_SNAPS_WEBSITE_URL } = require('./enums');

describe('Test Snap TxInsights-v2', function () {
  it('tests tx insights v2 functionality', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        ganacheOptions: defaultGanacheOptions,
        title: this.test.fullTitle(),
      },
      async ({ driver }) => {
        await driver.navigate();
        await unlockWallet(driver);

        // navigate to test snaps page and connect
        await driver.openNewPage(TEST_SNAPS_WEBSITE_URL);

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
          3,
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
        windowHandles = await driver.waitUntilXWindowHandles(3, 1000, 10000);
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
        windowHandles = await driver.waitUntilXWindowHandles(2, 1000, 10000);
        await driver.switchToWindowWithTitle('Test Snaps', windowHandles);
        await driver.clickElement('#sendInsights');

        // switch back to MetaMask window and switch to tx insights pane
        windowHandles = await driver.waitUntilXWindowHandles(3, 1000, 10000);
        await driver.switchToWindowWithTitle(
          WINDOW_TITLES.Dialog,
          windowHandles,
        );

        await driver.findClickableElement({
          text: 'Confirm',
          tag: 'button',
        });

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

        // click confirm to continue
        await driver.clickElement({
          text: 'Confirm',
          tag: 'button',
        });

        // check for warning from txinsights
        await driver.waitForSelector({
          css: '.snap-delineator__header__text',
          text: 'Warning from Insights Example Snap',
        });

        // check info in warning
        await driver.waitForSelector({
          css: '.snap-ui-markdown__text',
          text: 'ERC-20',
        });

        // click the warning confirm checkbox
        await driver.clickElement('.mm-checkbox__input');

        // click confirm button to send transaction
        await driver.clickElement({
          css: '.mm-box--color-error-inverse',
          text: 'Confirm',
          tag: 'button',
        });

        // switch back to MetaMask tab and switch to activity pane
        windowHandles = await driver.waitUntilXWindowHandles(2, 1000, 10000);
        await driver.switchToWindowWithTitle('MetaMask', windowHandles);
        await driver.clickElement({
          tag: 'button',
          text: 'Activity',
        });

        // wait for transaction confirmation
        await driver.waitForSelector({
          css: '.transaction-status-label',
          text: 'Confirmed',
        });
      },
    );
  });
});
