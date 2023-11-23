const { strict: assert } = require('assert');
const {
  withFixtures,
  unlockWallet,
  openDapp,
  defaultGanacheOptions,
  getWindowHandles,
} = require('../helpers');
const FixtureBuilder = require('../fixture-builder');

describe('PPOM Settings @no-mmi', function () {
  it('should not show the PPOM warning when toggle is off', async function () {
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder()
          .withNetworkControllerOnMainnet()
          .withPermissionControllerConnectedToTestDapp()
          .build(),
        ganacheOptions: defaultGanacheOptions,
        title: this.test.fullTitle(),
      },
      async ({ driver }) => {
        await unlockWallet(driver);

        await openDapp(driver);
        await driver.clickElement('#maliciousPermit');
        const windowHandles = await getWindowHandles(driver, 3);
        await driver.switchToWindow(windowHandles.popup);

        const blockaidResponseTitle =
          '[data-testid="security-provider-banner-alert"]';
        const exists = await driver.isElementPresent(blockaidResponseTitle);
        assert.equal(exists, false, 'This is a deceptive request');
      },
    );
  });

  it('should show the PPOM warning when the toggle is on', async function () {
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder()
          .withNetworkControllerOnMainnet()
          .withPermissionControllerConnectedToTestDapp()
          .build(),
        ganacheOptions: defaultGanacheOptions,
        title: this.test.fullTitle(),
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
          '[data-testid="settings-toggle-security-alert-blockaid"] .toggle-button > div',
        );

        await openDapp(driver);
        await driver.clickElement('#maliciousPermit');
        const windowHandles = await getWindowHandles(driver, 3);
        await driver.switchToWindow(windowHandles.popup);

        const blockaidResponseTitle =
          '[data-testid="security-provider-banner-alert"]';
        const exists = await driver.isElementPresent(blockaidResponseTitle);
        assert.equal(exists, true, 'This is a deceptive request');
      },
    );
  });
});
