const { strict: assert } = require('assert');
const { convertToHexValue, withFixtures } = require('../helpers');
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
  const ganacheOptions = {
    accounts: [
      {
        secretKey:
          '0x7C9529A67102755B7E6102D6D950AC5D5863C98713805CEC576B945B15B71EAC',
        balance: convertToHexValue(25000000000000000000),
      },
    ],
  };
  it('successfully unlocks an old vault, locks it, and unlock again', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().withKeyringControllerOldVault().build(),
        ganacheOptions,
        title: this.test.fullTitle(),
      },
      async ({ driver }) => {
        await driver.navigate();

        await unlock(driver);
        await lock(driver);
        await unlock(driver);
        const walletBalance = process.env.MULTICHAIN
          ? await driver.findElement(
              '.token-balance-overview__secondary-balance',
            )
          : await driver.findElement('.eth-overview__primary-balance');

        assert.equal(/^25\s*ETH$/u.test(await walletBalance.getText()), true);
      },
    );
  });
});
