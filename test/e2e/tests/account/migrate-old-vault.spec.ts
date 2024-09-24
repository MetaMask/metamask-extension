import { Suite } from 'mocha';
import { defaultGanacheOptions, withFixtures } from '../../helpers';
import FixtureBuilder from '../../fixture-builder';
import { Driver } from '../../webdriver/driver';
import HomePage from '../../page-objects/pages/homepage';
import { loginWithBalanceValidation } from '../../page-objects/flows/login.flow';

describe('Migrate vault with old encryption', function (this: Suite) {
  it('successfully unlocks an old vault, locks it, and unlocks again', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().withKeyringControllerOldVault().build(),
        ganacheOptions: defaultGanacheOptions,
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await loginWithBalanceValidation(driver);
        const homePage = new HomePage(driver);
        await homePage.headerNavbar.lockMetaMask();
        await loginWithBalanceValidation(driver);
      },
    );
  });
});
