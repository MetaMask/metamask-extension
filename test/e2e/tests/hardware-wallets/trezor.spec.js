const { strict: assert } = require('assert');
const FixtureBuilder = require('../../fixture-builder');
const {
  defaultGanacheOptions,
  unlockWallet,
  withFixtures,
  regularDelayMs,
} = require('../../helpers');

describe('Trezor Hardware', function () {
  it('unlocks the first account', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        ganacheOptions: defaultGanacheOptions,
        title: this.test.fullTitle(),
      },
      async ({ driver }) => {
        await unlockWallet(driver);

        // Open add hardware wallet modal
        await driver.clickElement('[data-testid="account-menu-icon"]');
        await driver.clickElement(
          '[data-testid="multichain-account-menu-popover-action-button"]',
        );
        await driver.clickElement({ text: 'Add hardware wallet' });

        // This delay is needed to mitigate an existing bug in FF
        // See https://github.com/metamask/metamask-extension/issues/25851
        await driver.delay(regularDelayMs);

        // Select Trezor
        await driver.clickElement('[data-testid="connect-trezor-btn"]');
        await driver.clickElement({ text: 'Continue' });

        // Select first account of first page and unlock
        await driver.clickElement('.hw-account-list__item__checkbox');
        await driver.clickElement({ text: 'Unlock' });

        // Check that an account has been added
        await driver.clickElement('[data-testid="account-menu-icon"]');
        const isTrezorAccountPresent = await driver.isElementPresent({
          text: 'Trezor 1',
        });
        assert.equal(isTrezorAccountPresent, true, 'Trezor account not found');
      },
    );
  });
});
