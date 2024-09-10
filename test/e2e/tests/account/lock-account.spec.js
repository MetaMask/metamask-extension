const { strict: assert } = require('assert');
const {
  defaultGanacheOptions,
  withFixtures,
  unlockWallet,
} = require('../../helpers');
const FixtureBuilder = require('../../fixture-builder');

describe('Lock and unlock', function () {
  it('successfully unlocks after lock', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        ganacheOptions: defaultGanacheOptions,
        title: this.test.fullTitle(),
      },
      async ({ driver }) => {
        await unlockWallet(driver);

        await driver.clickElement(
          '[data-testid="account-options-menu-button"]',
        );
        const lockButton = await driver.findClickableElement(
          '[data-testid="global-menu-lock"]',
        );
        assert.equal(await lockButton.getText(), 'Lock MetaMask');
        await lockButton.click();
        await unlockWallet(driver);

        const walletBalance = await driver.findElement(
          '.eth-overview__primary-balance',
        );
        assert.equal(/^25\s*ETH$/u.test(await walletBalance.getText()), true);
      },
    );
  });
});
