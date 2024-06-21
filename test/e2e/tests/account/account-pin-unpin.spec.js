const { strict: assert } = require('assert');
const {
  defaultGanacheOptions,
  withFixtures,
  unlockWallet,
} = require('../../helpers');
const FixtureBuilder = require('../../fixture-builder');

describe('Account list - pin/unpin functionality - ', function () {
  it('pin and unpin account by clicking the pin/unpin button', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        ganacheOptions: defaultGanacheOptions,
        title: this.test.fullTitle(),
      },
      async ({ driver }) => {
        const pinnedIconSelector = '.account-pinned-icon';
        await unlockWallet(driver);

        // pin account
        await driver.clickElement('[data-testid="account-menu-icon"]');
        await driver.clickElement(
          '[data-testid="account-list-item-menu-button"]',
        );
        await driver.clickElement('[data-testid="account-list-menu-pin"]');
        const pinnedIcon = await driver.findElement(pinnedIconSelector);
        assert.equal(await pinnedIcon.isDisplayed(), true);

        // unpin account
        await driver.clickElement(
          '[data-testid="account-list-item-menu-button"]',
        );
        await driver.clickElement('[data-testid="account-list-menu-pin"]');

        await driver.assertElementNotPresent(pinnedIconSelector, {
          waitAtLeastGuard: 200, // A waitAtLeastGuard of 200ms is the best choice here
        });
      },
    );
  });

  it('account once hidden should be unpinned and remain so even if revealed again', async function () {
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
        await driver.clickElement('[data-testid="account-list-menu-pin"]');
        const pinnedIcon = await driver.findElement('.account-pinned-icon');
        assert.equal(await pinnedIcon.isDisplayed(), true);
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
});
