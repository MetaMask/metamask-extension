const { strict: assert } = require('assert');
const { defaultGanacheOptions, withFixtures } = require('../helpers');
const FixtureBuilder = require('../fixture-builder');

const lock = async (driver) => {
  await driver.clickElement('[data-testid="account-options-menu-button"]');
  const lockButton = await driver.findClickableElement(
    '[data-testid="global-menu-lock"]',
  );
  await lockButton.click();
};

const unlock = async (driver) => {
  await driver.fill('#password', 'correct horse battery staple');
  await driver.press('#password', driver.Key.ENTER);
};

describe('Migrate vault with old encryption', function () {
  it('successfully unlocks an old vault, locks it, and unlock again', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().withKeyringControllerOldVault().build(),
        ganacheOptions: defaultGanacheOptions,
        title: this.test.fullTitle(),
      },
      async ({ driver }) => {
        await driver.navigate();

        await unlock(driver);
        await lock(driver);
        await unlock(driver);
        const walletBalance = await driver.findElement(
          '.eth-overview__primary-balance',
        );
        assert.equal(await walletBalance.getText(), '$42,500.00\nUSD');
      },
    );
  });
});
