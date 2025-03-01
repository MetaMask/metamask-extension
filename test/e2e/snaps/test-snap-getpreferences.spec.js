const { withFixtures, unlockWallet, WINDOW_TITLES } = require('../helpers');
const FixtureBuilder = require('../fixture-builder');
const { TEST_SNAPS_WEBSITE_URL } = require('./enums');

describe('Test Snap Get Preferences', function () {
  it('test snap_getPreferences functionality', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        title: this.test.fullTitle(),
      },
      async ({ driver }) => {
        await unlockWallet(driver);

        // navigate to test snaps page and connect to preferences snap
        await driver.openNewPage(TEST_SNAPS_WEBSITE_URL);

        // wait for page to load
        await driver.waitForSelector({
          text: 'Installed Snaps',
          tag: 'h2',
        });

        // find and click on the preferences snap connect button
        // the button has a data-testid="preferences-connect" attribute
        await driver.waitForSelector('[data-testid="preferences-connect"]');
        await driver.clickElement('[data-testid="preferences-connect"]');

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

        // look for the snap name
        await driver.waitForSelector({
          text: 'Preferences Example Snap',
          tag: 'p',
        });

        // wait for and click approve
        await driver.waitForSelector({
          text: 'Approve',
          tag: 'button',
        });
        await driver.clickElement({
          text: 'Approve',
          tag: 'button',
        });

        // switch back to test-snaps window
        await driver.switchToWindowWithTitle('Test Snaps');

        // wait for connection to be established
        await driver.waitForSelector({
          text: 'Connected',
          tag: 'span',
        });

        // click get preferences button
        await driver.waitForSelector('#getPreferences');
        await driver.clickElement('#getPreferences');

        // verify preferences result
        await driver.waitForSelector('#preferencesResult');
        await driver.findElement('#preferencesResult');

        // verify that the preferences object contains expected keys
        await driver.waitForSelector({
          css: '#preferencesResult',
          text: /locale/u,
        });
        await driver.waitForSelector({
          css: '#preferencesResult',
          text: /currency/u,
        });
        await driver.waitForSelector({
          css: '#preferencesResult',
          text: /hideBalances/u,
        });
        await driver.waitForSelector({
          css: '#preferencesResult',
          text: /useSecurityAlerts/u,
        });
        await driver.waitForSelector({
          css: '#preferencesResult',
          text: /useExternalPricingData/u,
        });
        await driver.waitForSelector({
          css: '#preferencesResult',
          text: /simulateOnChainActions/u,
        });
        await driver.waitForSelector({
          css: '#preferencesResult',
          text: /useTokenDetection/u,
        });
        await driver.waitForSelector({
          css: '#preferencesResult',
          text: /batchCheckBalances/u,
        });
        await driver.waitForSelector({
          css: '#preferencesResult',
          text: /displayNftMedia/u,
        });
        await driver.waitForSelector({
          css: '#preferencesResult',
          text: /useNftDetection/u,
        });
      },
    );
  });
});
