const { defaultGanacheOptions, withFixtures } = require('../../helpers');
const FixtureBuilder = require('../../fixture-builder');
import { loginWithBalanceValidaiton } from '../../page-objects/processes/login.process';

const lock = async (driver) => {
  await driver.clickElement('[data-testid="account-options-menu-button"]');
  const lockButton = await driver.findClickableElement(
    '[data-testid="global-menu-lock"]',
  );
  await lockButton.click();
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
        await loginWithBalanceValidaiton(driver);
        await lock(driver);
        await loginWithBalanceValidaiton(driver);
      },
    );
  });
});
