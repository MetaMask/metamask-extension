const { strict: assert } = require('assert');
const {
  withFixtures,
  unlockWallet,
  openDapp,
  defaultGanacheOptions,
} = require('../helpers');
const FixtureBuilder = require('../fixture-builder');

describe('Blockaid Settings', function () {
  it('should not show blockaid UI when toggle is off', async function () {
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder()
          .withPermissionControllerConnectedToTestDapp()
          .build(),
        ganacheOptions: defaultGanacheOptions,
        title: this.test.title,
      },
      async ({ driver }) => {
        await driver.navigate();
        await unlockWallet(driver);

        await driver.clickElement(
          '[data-testid="account-options-menu-button"]',
        );

        await driver.clickElement({ text: 'Settings', tag: 'div' });
        await driver.clickElement({ text: 'Experimental', tag: 'div' });

        await openDapp(driver);
        await driver.clickElement('#signPermit');
      },
    );
  });

  it('should show the blockaid UI when the toggle is on', async function () {
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder()
          .withPermissionControllerConnectedToTestDapp()
          .build(),
        ganacheOptions: defaultGanacheOptions,
        title: this.test.title,
      },
      async ({ driver }) => {
        await driver.navigate();
        await unlockWallet(driver);

        await driver.clickElement(
          '[data-testid="account-options-menu-button"]',
        );

        await driver.clickElement({ text: 'Settings', tag: 'div' });
        await driver.clickElement({ text: 'Experimental', tag: 'div' });

        await driver.clickElement(
          '[data-testid="transaction-security-check-blockaid"] .toggle-button > div',
        );

        await openDapp(driver);
        await driver.clickElement('#signPermit');

        const blockaidHeader = '[data-testid="blockaid-banner-alert"]';

        const exists = await driver.isElementPresent(blockaidHeader);
        assert.equal(exists, true, 'Request may not be safe');
      },
    );
  });
});
