const {
  withFixtures,
  defaultGanacheOptions,
  unlockWallet,
  WINDOW_TITLES,
} = require('../helpers');
const FixtureBuilder = require('../fixture-builder');
const { TEST_SNAPS_WEBSITE_URL } = require('./enums');

describe('Test Snap Name Lookup', function () {
  it('tests name-lookup functionality', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        ganacheOptions: defaultGanacheOptions,
        title: this.test.fullTitle(),
      },
      async ({ driver }) => {
        await unlockWallet(driver);

        // navigate to test snaps page and connect
        await driver.openNewPage(TEST_SNAPS_WEBSITE_URL);

        // wait for page to load
        await driver.waitForSelector({
          text: 'Installed Snaps',
          tag: 'h2',
        });

        // find and scroll to the namelookup test snap
        const snapButton1 = await driver.findElement('#connectname-lookup');
        await driver.scrollToElement(snapButton1);

        // added delay for firefox (deflake)
        await driver.delayFirefox(1000);

        // wait for and click connect
        await driver.waitForSelector('#connectname-lookup');
        await driver.clickElement('#connectname-lookup');

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

        // switch to fullscreen metamask tab
        await driver.switchToWindowWithTitle(
          WINDOW_TITLES.ExtensionInFullScreenView,
        );

        // switch network to ethereum-mainnet for name lookup to work
        await driver.clickElement('[data-testid="network-display"');
        await driver.waitForSelector({
          text: 'Ethereum Mainnet',
          tag: 'p',
        });
        await driver.clickElement({
          text: 'Ethereum Mainnet',
          tag: 'p',
        });

        // ensure we are on Mainnet
        await driver.waitForSelector('[data-testid="staking-entrypoint-0x1"]');

        // click send
        await driver.clickElement('[data-testid="eth-overview-send"]');

        // wait for input field and enter name to lookup
        await driver.waitForSelector('[data-testid="ens-input"]');
        await driver.pasteIntoField(
          '[data-testid="ens-input"]',
          'metamask.domain',
        );

        // verify name output from snap
        await driver.waitForSelector({
          text: '0xc0ff...4979',
          tag: 'p',
        });
      },
    );
  });
});
