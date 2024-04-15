const { strict: assert } = require('assert');
const {
  defaultGanacheOptions,
  withFixtures,
  unlockWallet,
} = require('../../helpers');
const FixtureBuilder = require('../../fixture-builder');

describe('Account list - hide/unhide functionality - ', function () {
  it('hide account by clicking hide button', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        ganacheOptions: defaultGanacheOptions,
        title: this.test.fullTitle(),
      },
      async ({ driver }) => {
        await unlockWallet(driver);

        await driver.clickElement('[data-testid="account-menu-icon"]');
        await driver.clickElement(
          '[data-testid="account-list-item-menu-button"]',
        );
        await driver.clickElement('[data-testid="account-list-menu-hide"]');
        const hiddenAccounts = await driver.findElement(
          '.hidden-accounts-list',
        );
        assert.equal(await hiddenAccounts.isDisplayed(), true);
      },
    );
  });

  it('unhide account by clicking show account button', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        ganacheOptions: defaultGanacheOptions,
        title: this.test.fullTitle(),
      },
      async ({ driver }) => {
        await unlockWallet(driver);

        await driver.clickElement('[data-testid="account-menu-icon"]');
        await driver.clickElement(
          '[data-testid="account-list-item-menu-button"]',
        );
        await driver.clickElement('[data-testid="account-list-menu-hide"]');

        await driver.clickElement('.hidden-accounts-list');

        await driver.clickElement(
          '.multichain-account-menu-popover__list--menu-item-hidden-account [data-testid="account-list-item-menu-button"]',
        );
        await driver.clickElement('[data-testid="account-list-menu-hide"]');

        const accounts = await driver.findElement(
          '.multichain-account-menu-popover__list--menu-item',
        );
        assert.equal(await accounts.isDisplayed(), true);
      },
    );
  });
});
