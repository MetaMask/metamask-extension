import { Suite } from 'mocha';
import { defaultGanacheOptions, withFixtures } from '../../helpers';
import FixtureBuilder from '../../fixture-builder';
import HomePage from '../../page-objects/pages/homepage';
import { Driver } from '../../webdriver/driver';
import { loginWithBalanceValidation } from '../../page-objects/flows/login.flow';

describe('Lock and unlock', function (this: Suite) {
  it('successfully unlocks after lock', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
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
