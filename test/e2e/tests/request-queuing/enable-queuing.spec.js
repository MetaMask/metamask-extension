const {
  withFixtures,
  defaultGanacheOptions,
  unlockWallet,
} = require('../../helpers');
const FixtureBuilder = require('../../fixture-builder');

describe('Toggle Request Queuing Setting', function () {
  it('should enable the request queuing setting ', async function () {
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder().build(),
        ganacheOptions: defaultGanacheOptions,
        failOnConsoleError: false,
        title: this.test.fullTitle(),
      },
      async ({ driver }) => {
        await driver.navigate();
        await unlockWallet(driver);

        // Open account menu button
        const accountOptionsMenuSelector =
          '[data-testid="account-options-menu-button"]';
        await driver.waitForSelector(accountOptionsMenuSelector);
        await driver.clickElement(accountOptionsMenuSelector);

        // Click settings from dropdown menu
        const globalMenuSettingsSelector =
          '[data-testid="global-menu-settings"]';
        await driver.waitForSelector(globalMenuSettingsSelector);
        await driver.clickElement(globalMenuSettingsSelector);

        // Click Experimental tab
        const securityAndPrivacyTabRawLocator = {
          text: 'Experimental',
          tag: 'div',
        };
        await driver.clickElement(securityAndPrivacyTabRawLocator);

        // Toggle request queue setting
        await driver.clickElement('.request-queue-toggle');
      },
    );
  });
});
