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
        await driver.waitForSelector('#connecttransaction-insights');
        await driver.clickElement('#connecttransaction-insights');

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

        // switch to test-snaps page and get accounts
        await driver.switchToWindowWithTitle(WINDOW_TITLES.TestSnaps);

        // click get accounts
        await driver.clickElement('#getAccounts');

        // switch back to MetaMask window
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

        // wait for and click confirm
        await driver.waitForSelector({
          text: 'Confirm',
          tag: 'button',
        });
        await driver.clickElement({
          text: 'Confirm',
          tag: 'button',
        });

        // switch to test-snaps page
        await driver.switchToWindowWithTitle(WINDOW_TITLES.TestSnaps);

        // click send tx
        await driver.clickElement('#sendInsights');

        // delay added for rendering (deflake)
        await driver.delay(2000);

        // switch back to MetaMask window
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

        // wait for and switch to insight snap pane
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
