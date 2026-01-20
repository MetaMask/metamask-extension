const { strict: assert } = require('assert');
const { withFixtures } = require('../../helpers');
const {
  loginWithBalanceValidation,
} = require('../../page-objects/flows/login.flow');
const { DAPP_URL, WINDOW_TITLES } = require('../../constants');
const FixtureBuilder = require('../../fixtures/fixture-builder');

describe('PPOM Settings', function () {
  // eslint-disable-next-line mocha/no-skipped-tests
  it.skip('should not show the PPOM warning when toggle is off', async function () {
    await withFixtures(
      {
        dappOptions: { numberOfTestDapps: 1 },
        fixtures: new FixtureBuilder()
          .withNetworkControllerOnMainnet()
          .withPermissionControllerConnectedToTestDapp()
          .build(),
        title: this.test.fullTitle(),
      },
      async ({ driver }) => {
        await loginWithBalanceValidation(driver);

        await driver.clickElement(
          '[data-testid="account-options-menu-button"]',
        );

        await driver.clickElement({ text: 'Settings', tag: 'div' });
        await driver.clickElement({ text: 'Security & privacy', tag: 'div' });

        await driver.clickElement(
          '[data-testid="settings-toggle-security-alert-blockaid"] .toggle-button > div',
        );

        await driver.openNewPage(DAPP_URL);
        await driver.clickElement('#maliciousPermit');
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

        const blockaidResponseTitle =
          '[data-testid="security-provider-banner-alert"]';
        const exists = await driver.isElementPresent(blockaidResponseTitle);
        assert.equal(exists, false, 'This is a deceptive request');
      },
    );
  });

  // eslint-disable-next-line mocha/no-skipped-tests
  it.skip('should show the PPOM warning when the toggle is on', async function () {
    await withFixtures(
      {
        dappOptions: { numberOfTestDapps: 1 },
        fixtures: new FixtureBuilder()
          .withNetworkControllerOnMainnet()
          .withPermissionControllerConnectedToTestDapp()
          .build(),
        title: this.test.fullTitle(),
      },
      async ({ driver }) => {
        await loginWithBalanceValidation(driver);

        await driver.openNewPage(DAPP_URL);
        await driver.clickElement('#maliciousPermit');
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

        const blockaidResponseTitle =
          '[data-testid="security-provider-banner-alert"]';
        const exists = await driver.isElementPresent(blockaidResponseTitle);
        assert.equal(exists, true, 'This is a deceptive request');
      },
    );
  });
});
