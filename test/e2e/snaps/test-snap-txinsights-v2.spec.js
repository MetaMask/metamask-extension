const {
  defaultGanacheOptions,
  withFixtures,
  unlockWallet,
  WINDOW_TITLES,
  tempToggleSettingRedesignedTransactionConfirmations,
} = require('../helpers');
const FixtureBuilder = require('../fixture-builder');
const { TEST_SNAPS_WEBSITE_URL } = require('./enums');

describe('Test Snap TxInsights-v2', function () {
  describe('Old confirmation screens', function () {
    it('tests tx insights v2 functionality', async function () {
      await withFixtures(
        {
          fixtures: new FixtureBuilder().build(),
          ganacheOptions: defaultGanacheOptions,
          title: this.test.fullTitle(),
        },
        async ({ driver }) => {
          await unlockWallet(driver);

          await tempToggleSettingRedesignedTransactionConfirmations(driver);

          // navigate to test snaps page and connect
          await driver.openNewPage(TEST_SNAPS_WEBSITE_URL);

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

          // switch to test-snaps page
          await driver.switchToWindowWithTitle(WINDOW_TITLES.TestSnaps);

          // wait for and click get accounts
          await driver.waitForSelector('#getAccounts');
          await driver.clickElement('#getAccounts');

          // switch back to MetaMask window
          await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

          // wait for and click confirm and wait for window to close
          await driver.waitForSelector({
            text: 'Connect',
            tag: 'button',
          });
          await driver.clickElementAndWaitForWindowToClose({
            text: 'Connect',
            tag: 'button',
          });

          // switch to test-snaps page and send tx
          await driver.switchToWindowWithTitle(WINDOW_TITLES.TestSnaps);
          await driver.clickElement('#sendInsights');

          // delay added for rendering (deflake)
          await driver.delay(2000);

          // switch back to MetaMask window and switch to tx insights pane
          await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

          // find confirm button
          await driver.findClickableElement({
            text: 'Confirm',
            tag: 'button',
          });

          // wait for and click insights snap tab
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
            css: '.snap-ui-renderer__text',
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

          // switch back to MetaMask tab
          await driver.switchToWindowWithTitle(
            WINDOW_TITLES.ExtensionInFullScreenView,
          );

          // switch to activity pane
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
});
