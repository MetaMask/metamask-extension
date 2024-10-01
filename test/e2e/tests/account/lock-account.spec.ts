import { Suite } from 'mocha';
import { defaultGanacheOptions, withFixtures } from '../../helpers';
import FixtureBuilder from '../../fixture-builder';
import HomePage from '../../page-objects/pages/homepage';
import { Driver } from '../../webdriver/driver';
import { Ganache } from '../../seeder/ganache';
import { loginWithBalanceValidation } from '../../page-objects/flows/login.flow';

describe('Lock and unlock', function (this: Suite) {
  it('successfully unlocks after lock', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        ganacheOptions: defaultGanacheOptions,
        title: this.test?.fullTitle(),
      },
      async ({
        driver,
        ganacheServer,
      }: {
        driver: Driver;
        ganacheServer?: Ganache;
      }) => {
        await loginWithBalanceValidation(driver, ganacheServer);
        const homePage = new HomePage(driver);
        await homePage.headerNavbar.lockMetaMask();
        await loginWithBalanceValidation(driver, ganacheServer);
      },
    );
  });
});
